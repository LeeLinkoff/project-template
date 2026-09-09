// scripts/generate-openapi-schemas.ts
//
// Generates OpenAPI component schemas by recursively scanning the TypeScript
// source tree.
//
// Any exported interface or type alias tagged with @openapi is automatically
// discovered and converted into an OpenAPI component schema. API types remain
// next to the code that owns them, and no separate registry of type names or
// source files has to be maintained.
//
//
// OpenAPI relationship:
//
// This file automatically generates OpenAPI data schemas from TypeScript interfaces and types marked with @openapi.
//
// The generated schemas are written to src\schemas.generated.ts.
//
// swagger-spec.ts imports those schemas and adds the HTTP endpoint information that cannot be determined from the TypeScript data types alone, such as routes, HTTP methods, query parameters, and response codes.
//
// Swagger UI displays the combined result.


import { createGenerator, type Config } from "ts-json-schema-generator";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

interface SchemaTarget {
  typeName: string;
  sourceFile: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, "..");
const SOURCE_ROOT = path.join(PROJECT_ROOT, "src");
const TSCONFIG_PATH = path.join(PROJECT_ROOT, "tsconfig.json");
const OUTPUT_PATH = path.join(SOURCE_ROOT, "schemas.generated.ts");

/**
 * Recursively returns TypeScript source files that may contain API contracts.
 *
 * Declaration files and the generated schema module are excluded because
 * neither should become an input to schema generation.
 */
function findTypeScriptFiles(directory: string): string[] {
  const sourceFiles: string[] = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      sourceFiles.push(...findTypeScriptFiles(fullPath));
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".d.ts") &&
      entry.name !== "schemas.generated.ts"
    ) {
      sourceFiles.push(fullPath);
    }
  }

  return sourceFiles;
}

/**
 * Determines whether a declaration has a leading JSDoc comment that explicitly marks the type as part of the OpenAPI contract.
 *
 * The source text is inspected directly instead of relying on TypeScript's JSDoc-tag interpretation, which is intended primarily for recognized
 * TypeScript/JSDoc tags and is not required for this custom marker.
 */
function hasOpenApiTag(declaration: ts.InterfaceDeclaration | ts.TypeAliasDeclaration, sourceFile: ts.SourceFile): boolean 
{
  const fullText = sourceFile.getFullText();

  const commentRanges = ts.getLeadingCommentRanges(fullText,declaration.getFullStart());

  if (!commentRanges || commentRanges.length === 0) {
    return false;
  }

   for (const commentRange of commentRanges) {
    const commentText = fullText.slice(commentRange.pos, commentRange.end);

    if ( commentText.startsWith("/**") && /(?:^|\s)@openapi(?:\s|$)/i.test(commentText) )
	{
      return true;
    }
  }

  return false;
}

/**
 * Discovers exported interfaces and type aliases marked with @openapi.
 *
 * The source tree itself is the registry. Internal exported TypeScript types
 * remain excluded unless they are intentionally annotated for API exposure.
 */
function discoverSchemaTargets(): SchemaTarget[] {
  const targets: SchemaTarget[] = [];

  for (const sourceFilePath of findTypeScriptFiles(SOURCE_ROOT)) {
    const sourceText = fs.readFileSync(sourceFilePath, "utf8");

    const sourceFile = ts.createSourceFile(
      sourceFilePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );

    for (const statement of sourceFile.statements) {
      if (
        !ts.isInterfaceDeclaration(statement) &&
        !ts.isTypeAliasDeclaration(statement)
      ) {
        continue;
      }

      const isExported =
        statement.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
        ) ?? false;

      if (!isExported || !hasOpenApiTag(statement, sourceFile)) {
        continue;
      }

      targets.push({
        typeName: statement.name.text,
        sourceFile: sourceFilePath
      });
    }
  }

  return targets;
}

/**
 * Converts generated JSON Schema constructs into their OpenAPI 3.0 equivalents.
 */
function toOpenApiSchema(
  jsonSchema: Record<string, unknown>
): Record<string, unknown> {
  const clone = JSON.parse(
    JSON.stringify(jsonSchema)
  ) as Record<string, unknown>;

  delete clone.$schema;
  delete clone.definitions;

  function walk(node: unknown): unknown {
    if (Array.isArray(node)) {
      return node.map(walk);
    }

    if (!node || typeof node !== "object") {
      return node;
    }

    const obj = node as Record<string, unknown>;

    // Convert JSON Schema nullable type arrays to OpenAPI 3.0 nullable syntax.
    if (Array.isArray(obj.type) && obj.type.includes("null")) {
      const nonNullTypes = (obj.type as string[]).filter(
        (type) => type !== "null"
      );

      if (nonNullTypes.length === 1) {
        obj.type = nonNullTypes[0];
      } else {
        obj.type = nonNullTypes;
      }

      obj.nullable = true;
    }

    // Convert nullable unions represented as anyOf.
    if (Array.isArray(obj.anyOf)) {
      const branches = obj.anyOf as Record<string, unknown>[];

      const hasNullBranch = branches.some(
        (branch) => branch.type === "null"
      );

      const nonNullBranches = branches.filter(
        (branch) => branch.type !== "null"
      );

      if (hasNullBranch && nonNullBranches.length === 1) {
        delete obj.anyOf;
        Object.assign(obj, nonNullBranches[0]);
        obj.nullable = true;
      }
    }

    // Convert JSON Schema definition references to OpenAPI component refs.
    if (typeof obj.$ref === "string") {
      obj.$ref = obj.$ref.replace(
        "#/definitions/",
        "#/components/schemas/"
      );
    }

    for (const key of Object.keys(obj)) {
      obj[key] = walk(obj[key]);
    }

    return obj;
  }

  return walk(clone) as Record<string, unknown>;
}

/**
 * Generates an OpenAPI schema from the TypeScript file that owns the
 * annotated API contract.
 */
function generateSchema(
  target: SchemaTarget
): Record<string, unknown> {
  const config: Config = {
    path: target.sourceFile,
    tsconfig: TSCONFIG_PATH,
    type: target.typeName,
    expose: "export",
    topRef: false,
    skipTypeCheck: false
  };

  const generator = createGenerator(config);
  const schema = generator.createSchema(target.typeName);

  return toOpenApiSchema(
    schema as unknown as Record<string, unknown>
  );
}

/**
 * Ensures two source files cannot silently define the same OpenAPI component
 * name and overwrite one another in the generated schema map.
 */
function validateUniqueTypeNames(targets: SchemaTarget[]): void {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const target of targets) {
    if (seen.has(target.typeName)) {
      duplicates.add(target.typeName);
    }

    seen.add(target.typeName);
  }

  if (duplicates.size > 0) {
    throw new Error(
      `Duplicate @openapi schema names found: ${Array.from(duplicates).join(
        ", "
      )}`
    );
  }
}

function main(): void {
  if (!fs.existsSync(SOURCE_ROOT)) {
    throw new Error(`Source directory not found: ${SOURCE_ROOT}`);
  }

  if (!fs.existsSync(TSCONFIG_PATH)) {
    throw new Error(`TypeScript configuration not found: ${TSCONFIG_PATH}`);
  }

  const targets = discoverSchemaTargets();

  if (targets.length === 0)
  {
	console.log("No exported TypeScript interfaces or type aliases tagged with @openapi were found.");
	console.log("Generating an empty OpenAPI schemas module. This is valid for the generic project template.");
  }

  validateUniqueTypeNames(targets);

  // Stable ordering prevents meaningless generated-file diffs caused by
  // filesystem enumeration order.
  targets.sort((a, b) => {
    const byName = a.typeName.localeCompare(b.typeName);

    if (byName !== 0) {
      return byName;
    }

    return a.sourceFile.localeCompare(b.sourceFile);
  });

  const schemas: Record<string, unknown> = {};

  for (const target of targets) {
    schemas[target.typeName] = generateSchema(target);

    console.log(
      `Generated OpenAPI schema for ${target.typeName} (${path.relative(
        PROJECT_ROOT,
        target.sourceFile
      )})`
    );
  }

  const fileContents =
    "// schemas.generated.ts\n" +
    "//\n" +
    "// AUTO-GENERATED by scripts/generate-openapi-schemas.ts.\n" +
    "// Do not edit manually. TypeScript contracts tagged with @openapi are the source of truth.\n\n" +
    "export const generatedSchemas: Record<string, unknown> = " +
    JSON.stringify(schemas, null, 2) +
    " as const;\n";

  fs.writeFileSync(OUTPUT_PATH, fileContents, "utf8");

  console.log(`Wrote ${OUTPUT_PATH}`);
}

main();
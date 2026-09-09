-- Example demonstration data for the reusable customers/orders/items schema.
-- Demonstrates the basic 1:M relationships:
--   customers 1 ----< many orders
--   orders    1 ----< many items

BEGIN;

TRUNCATE TABLE items, orders, customers
    RESTART IDENTITY CASCADE;

INSERT INTO customers
    (first_name, last_name, email, active, created_at, updated_at)
VALUES
    ('Maya', 'Chen', 'maya.chen@example.com', TRUE, NOW() - INTERVAL '180 days', NOW() - INTERVAL '5 days'),
    ('Daniel', 'Brooks', 'daniel.brooks@example.com', TRUE, NOW() - INTERVAL '120 days', NOW() - INTERVAL '12 days'),
    ('Priya', 'Shah', 'priya.shah@example.com', TRUE, NOW() - INTERVAL '75 days', NOW() - INTERVAL '3 days'),
    ('Elena', 'Torres', 'elena.torres@example.com', FALSE, NOW() - INTERVAL '240 days', NOW() - INTERVAL '45 days');

INSERT INTO orders
    (customer_id, status, order_date, total_amount, created_at, updated_at)
VALUES
    (1, 'completed',  NOW() - INTERVAL '30 days', 74.97, NOW() - INTERVAL '30 days', NOW() - INTERVAL '28 days'),
    (1, 'processing', NOW() - INTERVAL '3 days',  49.98, NOW() - INTERVAL '3 days',  NOW() - INTERVAL '1 day'),
    (2, 'completed',  NOW() - INTERVAL '18 days', 89.97, NOW() - INTERVAL '18 days', NOW() - INTERVAL '16 days'),
    (3, 'pending',    NOW() - INTERVAL '1 day',   34.99, NOW() - INTERVAL '1 day',   NOW() - INTERVAL '1 day'),
    (3, 'cancelled',  NOW() - INTERVAL '40 days', 19.99, NOW() - INTERVAL '40 days', NOW() - INTERVAL '38 days');

INSERT INTO items
    (order_id, name, description, created_at)
VALUES
    (1, 'Wireless Mouse',      'Example item for order 1', NOW() - INTERVAL '30 days'),
    (1, 'USB-C Cable',         'Example item for order 1', NOW() - INTERVAL '30 days'),
    (1, 'Laptop Stand',        'Example item for order 1', NOW() - INTERVAL '30 days'),

    (2, 'Mechanical Keyboard', 'Example item for order 2', NOW() - INTERVAL '3 days'),

    (3, 'Webcam',              'Example item for order 3', NOW() - INTERVAL '18 days'),
    (3, 'USB Hub',             'Example item for order 3', NOW() - INTERVAL '18 days'),

    (4, 'Bluetooth Speaker',   'Example item for order 4', NOW() - INTERVAL '1 day'),

    (5, 'Phone Stand',         'Example item for order 5', NOW() - INTERVAL '40 days');

COMMIT;

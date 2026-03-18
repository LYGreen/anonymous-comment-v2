CREATE TABLE comments (
    id INTEGER PRIMARY KEY NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    content VARCHAR(255) NOT NULL,
    quote_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role VARCHAR(255) CHECK (role IN ('user', 'admin')) DEFAULT 'user' NOT NULL
    );

CREATE VIEW v_mixed_comments AS
SELECT 
    c.*, 
    q.user_id AS quoted_user_id, 
    q.content AS quoted_content, 
    q.created_at AS quoted_created_at,
    q.quote_id AS quoted_quoted_id,
    q.role AS quoted_role
FROM comments c 
LEFT JOIN comments q ON c.quote_id = q.id;

DROP TABLE IF EXISTS subgoal_memory;

CREATE TABLE subgoal_memory (
    id SERIAL PRIMARY KEY,
    image_field BLOB,
    text_field TEXT,
    embedding VECTOR(256)
);
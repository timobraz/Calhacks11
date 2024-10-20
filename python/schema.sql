DROP TABLE IF EXISTS subgoal_memory;

CREATE TABLE subgoal_memory (
    id SERIAL PRIMARY KEY,
    subgoal_text TEXT,
    steps_taken TEXT,
    embedding VECTOR(256)
);
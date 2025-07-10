CREATE TABLE IF NOT EXISTS persons (
  id            CHAR(36) PRIMARY KEY,
  user_id       INT            NOT NULL,           -- owner
  first_name    VARCHAR(100)   NOT NULL,
  last_name     VARCHAR(100)   NOT NULL,
  gender        ENUM('male','female','other') NOT NULL,
  birth_date    DATE           NULL,
  death_date    DATE           NULL,
  bio           TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  CONSTRAINT fk_person_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Simple relationship table (bidirectional edge + type)
CREATE TABLE IF NOT EXISTS relationships (
  id              CHAR(36) PRIMARY KEY,
  person_id_1     CHAR(36) NOT NULL,
  person_id_2     CHAR(36) NOT NULL,
  rel_type        ENUM('parent','child','spouse','sibling') NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_p1 (person_id_1),
  INDEX idx_p2 (person_id_2)
); 
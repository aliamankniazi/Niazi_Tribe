-- Create database
CREATE DATABASE IF NOT EXISTS niazi_tribe;
USE niazi_tribe;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Family Trees table
CREATE TABLE IF NOT EXISTS family_trees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id INT NOT NULL,
    privacy_level ENUM('public', 'private', 'shared') NOT NULL DEFAULT 'private',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner (owner_id)
);

-- Tree Access table (for shared trees)
CREATE TABLE IF NOT EXISTS tree_access (
    tree_id INT NOT NULL,
    user_id INT NOT NULL,
    access_level ENUM('view', 'edit', 'admin') NOT NULL DEFAULT 'view',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tree_id, user_id),
    FOREIGN KEY (tree_id) REFERENCES family_trees(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Persons table (for genealogy data)
CREATE TABLE IF NOT EXISTS persons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tree_id INT NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    birth_date DATE,
    birth_place VARCHAR(255),
    death_date DATE,
    death_place VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tree_id) REFERENCES family_trees(id) ON DELETE CASCADE,
    INDEX idx_tree_person (tree_id),
    INDEX idx_name (last_name, first_name)
);

-- Relationships table
CREATE TABLE IF NOT EXISTS relationships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tree_id INT NOT NULL,
    person1_id INT NOT NULL,
    person2_id INT NOT NULL,
    relationship_type ENUM('parent', 'spouse', 'sibling') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tree_id) REFERENCES family_trees(id) ON DELETE CASCADE,
    FOREIGN KEY (person1_id) REFERENCES persons(id) ON DELETE CASCADE,
    FOREIGN KEY (person2_id) REFERENCES persons(id) ON DELETE CASCADE,
    INDEX idx_tree_rel (tree_id),
    INDEX idx_persons (person1_id, person2_id)
); 
<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/Person.php';
require_once __DIR__ . '/../models/FamilyTree.php';

class PersonController extends BaseController {
    private $personModel;
    private $treeModel;

    public function __construct() {
        parent::__construct();
        $this->personModel = new Person();
        $this->treeModel = new FamilyTree();
    }

    public function create() {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $data = $this->getRequestData();
        $validation = $this->validateRequired($data, ['tree_id', 'first_name', 'last_name', 'gender']);
        if ($validation !== true) return $validation;

        // Check tree access
        $access = $this->treeModel->checkAccess($data['tree_id'], $this->auth->getCurrentUser()['id']);
        if (!$access || ($access !== 'owner' && $access !== 'admin' && $access !== 'edit')) {
            return $this->error('Access denied', 403);
        }

        try {
            $personId = $this->personModel->create($data);
            return $this->response(['id' => $personId]);
        } catch (Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    public function get($personId) {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $person = $this->personModel->find($personId);
        if (!$person) {
            return $this->error('Person not found', 404);
        }

        // Check tree access
        $access = $this->treeModel->checkAccess($person['tree_id'], $this->auth->getCurrentUser()['id']);
        if (!$access && $this->treeModel->find($person['tree_id'])['privacy_level'] !== 'public') {
            return $this->error('Access denied', 403);
        }

        // Get relationships
        $person['relationships'] = $this->personModel->getRelationships($personId);
        return $this->response($person);
    }

    public function update($personId) {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $person = $this->personModel->find($personId);
        if (!$person) {
            return $this->error('Person not found', 404);
        }

        // Check tree access
        $access = $this->treeModel->checkAccess($person['tree_id'], $this->auth->getCurrentUser()['id']);
        if (!$access || ($access !== 'owner' && $access !== 'admin' && $access !== 'edit')) {
            return $this->error('Access denied', 403);
        }

        $data = $this->getRequestData();
        try {
            $this->personModel->update($personId, $data);
            return $this->response(['id' => $personId]);
        } catch (Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    public function delete($personId) {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $person = $this->personModel->find($personId);
        if (!$person) {
            return $this->error('Person not found', 404);
        }

        // Check tree access
        $access = $this->treeModel->checkAccess($person['tree_id'], $this->auth->getCurrentUser()['id']);
        if (!$access || ($access !== 'owner' && $access !== 'admin' && $access !== 'edit')) {
            return $this->error('Access denied', 403);
        }

        try {
            $this->personModel->delete($personId);
            return $this->response(['success' => true]);
        } catch (Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    public function addRelationship() {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $data = $this->getRequestData();
        $validation = $this->validateRequired($data, ['person1_id', 'person2_id', 'type', 'tree_id']);
        if ($validation !== true) return $validation;

        // Check tree access
        $access = $this->treeModel->checkAccess($data['tree_id'], $this->auth->getCurrentUser()['id']);
        if (!$access || ($access !== 'owner' && $access !== 'admin' && $access !== 'edit')) {
            return $this->error('Access denied', 403);
        }

        try {
            $this->personModel->addRelationship(
                $data['person1_id'],
                $data['person2_id'],
                $data['type'],
                $data['tree_id']
            );
            return $this->response(['success' => true]);
        } catch (Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    public function removeRelationship() {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $data = $this->getRequestData();
        $validation = $this->validateRequired($data, ['person1_id', 'person2_id', 'tree_id']);
        if ($validation !== true) return $validation;

        // Check tree access
        $access = $this->treeModel->checkAccess($data['tree_id'], $this->auth->getCurrentUser()['id']);
        if (!$access || ($access !== 'owner' && $access !== 'admin' && $access !== 'edit')) {
            return $this->error('Access denied', 403);
        }

        try {
            $this->personModel->removeRelationship(
                $data['person1_id'],
                $data['person2_id'],
                $data['type'] ?? null
            );
            return $this->response(['success' => true]);
        } catch (Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    public function search($treeId) {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        // Check tree access
        $access = $this->treeModel->checkAccess($treeId, $this->auth->getCurrentUser()['id']);
        if (!$access && $this->treeModel->find($treeId)['privacy_level'] !== 'public') {
            return $this->error('Access denied', 403);
        }

        $query = $_GET['q'] ?? '';
        if (empty($query)) {
            return $this->error('Search query required', 400);
        }

        try {
            $results = $this->personModel->search($treeId, $query);
            return $this->response($results);
        } catch (Exception $e) {
            return $this->error($e->getMessage());
        }
    }
} 
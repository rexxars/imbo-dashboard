<?php
class ImboDashboard_Controller_Router_Route_Upload extends ImboDashboard_Controller_Router_Route_Instance {

    /**
     * Attempt to match the current request URL
     * If a match is found, instantiate a new ImboClient and normalize the data
     *
     * @see Zend_Controller_Router_Route::match()
     */
    public function match($path, $partial = false) {
        $match = parent::match($path, $partial);
        
        if ($match) {
            $match['data'] = $this->getData();
            if (!$match['data']) {
                return false;
            }
        }

        return $match;
    }
    
    private function getData() {
        $method = $this->getMethod();
        if ($method == 'PUT') {
            return file_get_contents('php://input');
        } else if ($method == 'POST' && isset($_FILES['file'])) {
            return file_get_contents($_FILES['file']['tmp_name']);
        }
        
        return false;
    }
    
    private function getMethod() {
        return isset($_SERVER['REQUEST_METHOD']) ? strtoupper($_SERVER['REQUEST_METHOD']) : 'GET';
    }

}
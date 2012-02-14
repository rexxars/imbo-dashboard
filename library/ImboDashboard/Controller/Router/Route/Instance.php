<?php
class ImboDashboard_Controller_Router_Route_Instance extends Zend_Controller_Router_Route {

    /**
     * Holds imbo instance configuration
     *
     * @var array(array)
     */
    protected $instances = array();

    /**
     * Add imbo instance configuration
     *
     * @param array(array) $instances
     */
    public function addInstances(array $instances) {
        $this->instances = array_merge($this->instances, $instances);
    }

    /**
     * Attempt to match the current request URL
     * If a match is found, instantiate a new ImboClient
     *
     * @see Zend_Controller_Router_Route::match()
     */
    public function match($path, $partial = false) {
        $match    = parent::match($path, $partial);
        $config   = array();
        $instance = false;
        $imgUrl   = '';

        if ($match) {
            $instance = $match['instance'];

            // Check if the passed instance exists
            if (!isset($this->instances[$instance])) {
                throw new Zend_Controller_Router_Exception('Instance "' . $instance . '" does not exist in configuration', 404);
            }

            // If this is not a sub-action, check if this is an XMLHttpRequest
            if ($match['controller'] != 'instance' && (!isset($_SERVER['X_REQUESTED_WITH']) || $_SERVER['X_REQUESTED_WITH'] != 'XMLHttpRequest')) {
                $match['controller'] = 'instance';
                $match['action'] = 'index';
            }

            // Create an imbo client for the given instance and make it available in request
            $config = $this->instances[$instance];
            $match['imboClient'] = new ImboClient\Client($config['host'], $config['pubkey'], $config['privkey']);
            $imgUrl = $match['imboClient']->getImagesUrl();
        }

        // Set active instance name to view so we may use it in frontend
        $frontController = Zend_Controller_Front::getInstance();
        $view = $frontController->getParam('bootstrap')->getResource('view');
        $view->activeInstance = $instance;
        $view->imagesUrl      = $imgUrl;
        $view->maxUploadSize  = $this->getMaxUploadSize($config);

        return $match;
    }

    /**
     * Get the maximum upload size, in bytes, using either configured or php.ini setting
     *
     * @param array $config
     * @return integer
     */
    private function getMaxUploadSize($config) {
        if (isset($config['maxSize'])) {
            return (int) $config['maxSize'];
        }

        return $this->returnBytes(ini_get('upload_max_filesize'));
    }

    /**
     * Return the number of bytes from a value such as '12M' or '300K'
     *
     * @param string $val
     * @return integer
     */
    private function returnBytes($val) {
        $val  = trim($val);
        $last = strtolower($val[strlen($val) - 1]);
        switch($last) {
            case 'g':
                $val *= 1024;
            case 'm':
                $val *= 1024;
            case 'k':
                $val *= 1024;
        }

        return (int) $val;
    }
}
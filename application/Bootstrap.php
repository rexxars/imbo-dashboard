<?php
class Bootstrap extends Zend_Application_Bootstrap_Bootstrap {
    
    /**
     * Holds the configuration for imbo instances defined in config
     * 
     * @var array(array)
     */
    protected $imboInstances = array();
    
    /**
     * Load imbo instances from config and set to view
     */
    protected function _initInstances() {
        // Store locally so we can use it in our router
        $this->imboInstances = $this->getOption('imbo');
        
        // Set names of available instances to the view
        $view = $this->bootstrap('view')->getResource('view');
        $view->imboInstances = array_keys($this->imboInstances);
    }

    /**
     * Initialize routes for the dashboard
     */
    protected function _initRoutes() {
        $frontController = $this->bootstrap('frontController')->getResource('frontController');

        // Get the router instance so we can add our routes
        $router = $frontController->getRouter();
        $router->removeDefaultRoutes();
        
        // Init instance routes
        $instanceRoutes = array();
        $instanceRoutes[] = new ImboDashboard_Controller_Router_Route_Instance('/:instance/:controller/:action/*', array(
            'controller' => 'instance',
            'action'     => 'index'
        ));
        $instanceRoutes[] = new ImboDashboard_Controller_Router_Route_Upload('/:instance/upload/', array(
            'controller' => 'instance',
            'action'     => 'upload'
        ));
        
        foreach ($instanceRoutes as $route) {
            $route->addInstances($this->imboInstances);
        }

        // Define actual routes
        $routes = array(
            'index'    => new Zend_Controller_Router_Route_Static('/', array(
                'controller' => 'index',
                'action'     => 'index',
            )),

            //'instance' => $instanceRoute
        );

        $router->addRoutes($routes);
        $router->addRoutes($instanceRoutes);
        return $router;
    }
}
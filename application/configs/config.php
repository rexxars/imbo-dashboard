<?php
return array(
    'includePaths' => array(
        realpath(APPLICATION_PATH . '/../library'),
    ),
    'appnamespace' => 'ImboDashboard',
    'autoloaderNamespaces' => array(
        'ImboClient', 'ImboDashboard'
    ),
    'bootstrap' => array(
        'path'  => APPLICATION_PATH . '/Bootstrap.php',
        'class' => 'Bootstrap',
    ),
    'resources' => array(
        'frontController' => array(
            'controllerDirectory' => APPLICATION_PATH . '/controllers',
            'params'              => array(
                'displayExceptions'          => 1,
                'useDefaultControllerAlways' => 0,
            ),
        ),
        'modules' => array(),
        'view'    => array(),
        'layout'  => array(
            'layoutPath' => APPLICATION_PATH . '/layouts/scripts',
        ),
    ),

    'imbo' => require(__DIR__ . '/instances.php'),
);
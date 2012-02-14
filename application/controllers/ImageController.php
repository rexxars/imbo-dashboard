<?php
class ImageController extends Zend_Controller_Action {

    public function indexAction() {

    }
    
    public function urlAction() {
        $imbo = $this->_request->getParam('imboClient');
        $url = $imbo->getImageUrl($this->_request->getParam('id'));
        $this->_helper->json(array('url' => (string) $url));
    }

}
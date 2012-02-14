<?php
class InstanceController extends Zend_Controller_Action {

    public function indexAction() {
        $imbo = $this->_request->getParam('imboClient');

        $this->view->itemsPerPage = 20;
        $this->view->totalPages   = ceil($imbo->getNumImages() / $this->view->itemsPerPage);
    }

    public function imagesAction() {
        $imbo  = $this->_request->getParam('imboClient');
        $page  = (int) $this->_request->getParam('page', 1);
        $limit = (int) $this->_request->getParam('limit', 20);

        $query = new ImboClient\ImagesQuery\Query();
        $query->page($page)->num($limit);

        $images   = $imbo->getImages($query) ?: array();

        $filtered = array();
        foreach ($images as $image) {
            $filtered[] = array(
                'url'      => (string) $imbo->getImageUrl($image->getIdentifier())->thumbnail(260, 180),
                'id'       => $image->getIdentifier(),
                'height'   => $image->getHeight(),
                'width'    => $image->getWidth(),
                'added'    => (int) $image->getAddedDate()->format('U'),
            );
        }
        $this->_helper->json($filtered);
    }

    public function uploadAction() {
        $imbo  = $this->_request->getParam('imboClient');
        $image = $this->_request->getParam('data');

        // Temporary fix while we wait for a method in the imbo client
        $file = '/tmp/' . microtime(true) . rand(0, PHP_INT_MAX);
        file_put_contents($file, $image);
        try {
            $res = $imbo->addImage($file);
        } catch (Exception $e) {
            unlink($file);
            $this->_helper->json(array('error' => $e->getMessage()));
        }

        $identifier = $res->getImageIdentifier();
        $url = $imbo->getImageUrl($identifier)->thumbnail(260, 180);
        $this->_helper->json(array('url' => (string) $url, 'id' => $identifier));
    }

}
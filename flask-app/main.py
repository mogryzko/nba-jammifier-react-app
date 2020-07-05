import argparse
import os
import sys
import random
import math
import numpy as np
#import skimage.io
import cv2
import masking
import imageio
import player_choose
import stabilize
import exaggeration
import glob
import scipy.misc
from PIL import Image
import re

# Faster CPU?
os.environ['TF_CPP_MIN_LOG_LEVEL']='2'



def create_gif(path, filenames, save_path):
    filenames = sorted(filenames, key = lambda f: int(re.search(r'-([-+]?[0-9]+).png', f).group(1)))
    images = []
    for filename in filenames:
        images.append(imageio.imread(path + '/' + filename))
    imageio.mimsave(save_path, images)


def get_photo_names(path):
    photo_file_names = []
    for file in os.listdir(path):
        if file.endswith(".png"):
            photo_file_names.append(file)
    return photo_file_names


if __name__ == '__main__':

    folder_name = 'calvin-dunk-folder'
    path = './static/uploads/' + folder_name
    save_folder = './static/uploads/' + folder_name + '/gifs'
    path_to_model_folder = './Mask_RCNN/'
    path_to_gif = path + '/gifs/original.gif'
    exag = 100
    load = False
    dunk_start = 6
    dunk_end = 11

    photo_names = get_photo_names(path)
    create_gif(path, photo_names, path_to_gif)
    
    

    if not load:
        #Load Mask R-CNN Model

        print("loading Mask R-CNN model...")

        ROOT_DIR = os.path.abspath(path_to_model_folder)
        sys.path.append(ROOT_DIR)  # To find local version of the library
        import mrcnn.model as modellib
        sys.path.append(os.path.join(ROOT_DIR, "samples/coco/"))  # To find local version
        import coco
        MODEL_DIR = os.path.join(ROOT_DIR, "logs")
        COCO_MODEL_PATH = os.path.join(ROOT_DIR, "mask_rcnn_coco.h5")
        if not os.path.exists(COCO_MODEL_PATH):
            utils.download_trained_weights(COCO_MODEL_PATH)
        
        class_names = ['BG', 'person', 'bicycle', 'car', 'motorcycle', 'airplane',
                       'bus', 'train', 'truck', 'boat', 'traffic light',
                       'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird',
                       'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear',
                       'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie',
                       'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
                       'kite', 'baseball bat', 'baseball glove', 'skateboard',
                       'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup',
                       'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
                       'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza',
                       'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed',
                       'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote',
                       'keyboard', 'cell phone', 'microwave', 'oven', 'toaster',
                       'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors',
                       'teddy bear', 'hair drier', 'toothbrush']
        
        class_names = ['person']
        class InferenceConfig(coco.CocoConfig):
            # Set batch size to 1 since we'll be running inference on
            # one image at a time. Batch size = GPU_COUNT * IMAGES_PER_GPU
            GPU_COUNT = 1
            IMAGES_PER_GPU = 1
        config = InferenceConfig()
        model = modellib.MaskRCNN(mode="inference", model_dir=MODEL_DIR, config=config)
        model.load_weights(COCO_MODEL_PATH, by_name=True)

    # Load gif
    print("loading dunk gif...")
    gif = imageio.mimread(path_to_gif, memtest=False)

    if load:
        print("loading masks...")
        masks = np.load(save_folder + '/masks.npy')
    else:
        print("click on player and press q to exit")
        # Open window and ask for xy coordinate contained in player
        xy = player_choose.click_window(gif[dunk_start])

        # Get masks
        print("creating masks...")
        masks = masking.get_masks(gif, dunk_start, dunk_end, xy, model, save=True, folder=save_folder)

    # Get homographies
    print("calculating and saving homographies...")
    Hs, stabilized_gif, stab_height, stab_width = stabilize.generate_hs(gif, folder=save_folder)

    # Generate stabilized gif of masks
    stabilized_masks = stabilize.generate_stabilized_masks(dunk_start, dunk_end, masks, Hs, stab_height, stab_width)
    imageio.mimsave(save_folder+'/stabilized_masks.gif', stabilized_masks)


    # Get poly function for exaggeration
    print("calculating exaggeration...")

    #gauss_kernel = 20 if len(gif) > 200 else len(gif)//10
    gauss_kernel = 1
    xs, gauss, cs = exaggeration.center_of_mass(stabilized_masks, gauss_kernel)

    _, ys, first_poly = exaggeration.exaggerated_poly(gauss, exaggeration=exag)

    # Exaggerate movement
    print("exaggerating...")

    adj_gif = exaggeration.overlay_gif(gif, Hs, masks, xs, ys, dunk_start, dunk_end, stabilized_gif, stabilized_masks)
    imageio.mimsave(save_folder+'/final.gif', adj_gif)











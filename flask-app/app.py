from flask import Flask, render_template, request, redirect, jsonify, send_file, Response, make_response
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
import tensorflow as tf
import io
import time
import base64

app = Flask(__name__)

path_to_model_folder = app.root_path + '/Mask_RCNN/'
graph = tf.get_default_graph()


def load_model():
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
    return model


def create_video(path, filenames, save_path):
    filenames = sorted(filenames, key = lambda f: int(re.search(r'([-+]?[0-9]+).jpg', f).group(1)))
    frame = cv2.imread(os.path.join(path, filenames[0]))
    height, width, layers = frame.shape

    fourcc = cv2.VideoWriter_fourcc(*'H264')
    video = cv2.VideoWriter(save_path, fourcc, 30, (width,height))

    #video = cv2.VideoWriter(save_path, 0, 30, (width,height))

    for image in filenames:
        video.write(cv2.imread(os.path.join(path, image)))

    cv2.destroyAllWindows()
    video.release()
    return height, width


def create_gif(path, filenames, save_path):
    filenames = sorted(filenames, key = lambda f: int(re.search(r'([-+]?[0-9]+).jpg', f).group(1)))

    with imageio.get_writer(save_path, mode='I') as gif:
        for i in range(0, len(filenames)):
            image = imageio.imread(os.path.join(path, filenames[i]))
            gif.append_data(image)


def get_photo_names(path):
    photo_file_names = []
    for file in os.listdir(path):
        if file.endswith(".jpg"):
            photo_file_names.append(file)
    return photo_file_names



model = load_model()



@app.route('/upload_video', methods = ['POST'])
def upload_video():
    video = request.files['file']
    uploads_path = app.root_path +  '/static/uploads'
    folder_name = str(int(time.time()*1000))
    dunk_folder_path = uploads_path + '/' + folder_name
    if not os.path.exists(dunk_folder_path):
        os.makedirs(dunk_folder_path)
    video_filepath = dunk_folder_path + '/' + video.filename
    video.save(video_filepath)

    # convert video to photos
    vidcap = cv2.VideoCapture(video_filepath)
    fps = vidcap.get(cv2.CAP_PROP_FPS)
    success,image = vidcap.read()
    count = 0
    while success:
        cv2.imwrite(dunk_folder_path + "/%d.jpg" % count, image)     # save frame as jpg file
        success,image = vidcap.read()
        count += 1

    os.remove(video_filepath)

    resp = jsonify({'folder_name': folder_name, 'num_imgs': count - 1, 'fps': fps})
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp



@app.route('/return_img', methods= ['GET'])
def return_img():
    img = request.args.get('img')
    folder_name = request.args.get('folderName')
    uploads_path = app.root_path +  '/static/uploads'
    img_path = uploads_path + '/' + folder_name + '/' + img +'.jpg'
    
    resp = make_response(img_path)
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp
    '''
    with open(img_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read())
        resp = make_response(encoded_string)
        resp.headers['Access-Control-Allow-Origin'] = '*'
        return resp
    '''

@app.route('/return_final_video', methods= ['GET'])
def return_final_video():
    folder_name = request.args.get('folderName')
    uploads_path = app.root_path +  '/static/uploads'
    video_path = uploads_path + '/' + folder_name + '/gifs/' + 'original.mp4'
    
    resp = make_response(send_file(video_path, 'video/mp4', attachment_filename='original.mp4'))
    resp.headers['Content-Disposition'] = 'inline'
    return resp


@app.route('/exaggerate', methods = ['GET'])
def exaggerate():
    print("EXAGGERATING")
    folder_name = request.args.get('folderName')
    exag = int(request.args.get('exag'))
    dunk_start = int(request.args.get('dunk_start'))
    dunk_end = int(request.args.get('dunk_end'))
    xy = [int(float(request.args.get('x'))), int(float(request.args.get('y')))]
    fps = int(float(request.args.get('fps')))

    path = app.root_path + '/static/uploads/' + folder_name
    
    save_folder = app.root_path + '/static/uploads/' + folder_name + '/gifs'
    if not os.path.isdir(save_folder):
        os.makedirs(save_folder)

    path_to_model_folder = app.root_path + '/Mask_RCNN/'
    path_to_gif = path + '/gifs/original.gif'
    path_to_video = path + '/gifs/original.mp4'


    photo_names = get_photo_names(path)
    create_gif(path, photo_names, path_to_gif)
    height, width = create_video(path, photo_names, path_to_video)

    # Load gif
    print("loading dunk gif...")
    gif = imageio.mimread(path_to_gif, memtest=False)

    load = False

    if load:
        print("loading masks...")
        masks = np.load(save_folder + '/masks.npy')
    else:

        # Get masks
        print("creating masks...")
        start_time = time.time()
        masks = masking.get_masks(gif, dunk_start, dunk_end, xy, model, graph, save=True, folder=save_folder)
        print("time to create masks: ", time.time()-start_time)

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


    resp = make_response({"height": height, "width": width})
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp



if __name__ == '__main__':
    app.run(debug=True, port=5000)
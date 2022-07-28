### Summary


This repo contains:
 - raw data of moonboard problems scraped from moonboard site using scraping code in https://github.com/gestalt-howard/moonGen
 - python notebook for training and evaluating a simple CNN to predict the grade of a moonboard problem
 - code to deploy a website which allows user to specify a moonboard problem and runs the trained CNN on it.
 - The final results are hosted at `moonboard.markmliu.com`

### Details

 - The CNN has a simple network architecture based on https://www.tensorflow.org/tutorials/images/cnn; the main modification was to output the predicted grade as a linear regression problem instead of predicting class labels.
 - Problems are encoded as {0,1}^(11x18) representing the set of holds which are "on".
 - The website can be run with `sudo ./serve.sh` from the `website` directory.
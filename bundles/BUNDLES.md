# Bundles

One of the initial steps is to seed CodaLab with all the standard and
state-of-the-art algorithms as well as popular datasets in machine learning,
NLP, and computer vision.  This document keeps track of the programs and
datasets which are to be uploaded to CodaLab, as well as providing guidelines
on how to do this.

This is necessarily going to be an incomplete list.  One strategy is to read a
couple of papers in an area (e.g., collaborative filtering), see what the
standard datasets are, acquire those, and then obtain the implementations from
those papers and reproduce the results.

Recall that each program and dataset is a Bundle, which is either:

- Just a directory that contains files, or
- References to other Bundles (typically a program and a dataset) and a command
  to run.

Here are some guidelines:

- Document everything you do in the description of the Bundle.
- Create one Bundle which just represents the raw data or code from the source
  without modifications.  It basically should be just a unpacking of the zip
  file that is downloaded.
- If code needs to be compiled, create a new Bundle to do that, where the
  command is the compilation command (e.g., `make`).
  If compilation depends on other libraries (e.g., libboost), make them new
  Bundles if they do not already exist.
- If the data is in a non-standard format (for that task), then create another
  Bundle where the command does the conversion.  For example, sequence tagging
  should use the CoNLL shared task format.  If no standard format exists,
  then use your judgement to create it or talk to someone about it.  Document
  the format.
- Programs will often have many ways of invoking them.  Pick a few
  representative settings, and a small sample dataset, and create a run and
  document this.
- Eventually, all of this will be done directly in CodaLab, but for now, we
  will put all the code in GitHub and data on the test server, and import it
  into CodaLab later.  In particular, create a directory for yourself (e.g.,
  pliang).  For each Bundle that you download, create a `download.sh` file
  which downloads the files from the test server.  Do not check data files into
  git.  Then, create a bash script (e.g., `basic_ml.sh`), in which you should
  interleave comments with creation of Bundles in your sample scenario.

### Utilities

- Converter between csv, tsv, json, arff formats.
- Programs that plot curves (turn tsv into a jpg).

### Learning algorithms

- [Weka](http://www.cs.waikato.ac.nz/ml/weka/): a comprehensive Java library
  with many different algorithms.
- [scikit-learn](http://scikit-learn.org/stable/): a Python library which is 
  popular and good for prototyping.
- [R](http://cran.us.r-project.org/)
- [Matlab](http://www.mathworks.com/discovery/machine-learning.html): licensing is tricky.
- [Vowpal Wabbit](https://github.com/JohnLangford/vowpal_wabbit/)

We should make sure we have good solid implementations for the following algorithms:

- Naive Bayes
- K-nearest neighbors
- Boosted decision trees
- Logistic regression (batch or stochastic updates)
- SVM (batch or stochastic updates)

### Standard machine learning datasets

- [UCI repository](http://archive.ics.uci.edu/ml/): contains many classification and regression datasets.
- Collaborative filtering?
- Ranking?

### NLP datasets

- [CoNLL](http://www.clips.ua.ac.be/conll2003/): each year, CoNLL runs a Shared
  Task, which is a competition with a dataset.

We should get coverage on the following tasks:

- Named-entity recognition (CoNLL shared task 2002, 2003)
- Semantic role labeling (CoNLL shared task 2004, 2005)
- Dependency parsing (CoNLL shared task 2006)
- Coreference resolution (MUC, CoNLL)
- Text classification (Reuters, 20 news groups, sentiment, spam)
- Constituency parsing (Wall Street Journal, [Google Web Treebank Weblogs](http://mlcomp.org/datasets/1002))
- Machine translation [NIST competition](http://www.nist.gov/itl/iad/mig/openmt12.cfm)

### Vision datasets

- [CIFAR](http://www.cs.toronto.edu/~kriz/cifar.html)
- [STL10](http://www.stanford.edu/~acoates/stl10/)
- [CV papers](http://www.cvpapers.com/datasets.html): an impressive list of
  computer vision datasets for detection, classification, recognition,
  segmentation, etc.

### Tutorials

- [Predicting Closed Question](http://fastml.com/predicting-closed-questions-on-stack-overflow/)
- [Merk Challenge](http://fastml.com/merck-challenge/)
- [Predicting Advertised Salaries](http://fastml.com/predicting-advertised-salaries/)
- [Large Scale L1 Feature Selection](http://fastml.com/large-scale-l1-feature-selection-with-vowpal-wabbit/)
- [Automate Access Control](http://fastml.com/amazon-aspires-to-automate-access-control/)
- [Non-linear w/ Vowpal](http://fastml.com/go-non-linear-with-vowpal-wabbit/)

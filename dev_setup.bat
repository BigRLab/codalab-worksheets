@echo off

REM This is the developer setup script for windows.
REM We assume you installed python in C:\Python27
SET PYTHON=C:\Python27

REM Update pip
%PYTHON%\Scripts\easy_install pip
%PYTHON%\Scripts\pip install virtualenv

REM Create the virtual environment named venv
%PYTHON%\Scripts\virtualenv --clear --distribute venv 

REM Activate the virtual environment
CALL venv\Scripts\activate.bat

REM Update pip and distribute in venv
pip install --upgrade pip
pip install --upgrade distribute

REM Install development requirements
pip install -r codalab\requirements\dev.txt

REM Initialize the app
python codalab\manage.py syncdb

REM Do model updates
python codalab\manage.py migrate

ECHO "You are now ready to run: python codalab\manage.py runserver"
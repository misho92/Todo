Todo
====

Instruction to set up the project

1. Install python
Download and install any stable python version (the one used for project development is 2.7.7) from the official site - https://www.python.org/downloads/ . Upon the completion of the 
installation, open a Command Prompt and enter the command python. If you see the Python prompt, installation was successful. However, in certain circumstances, the installer may not set
your Windows installation’s PATH environment variable correctly. This will result in the python command not being found. Under Windows 7, you can rectify this by performing the following:

    Click the Start button, right click My Computer and select Properties.
    Click the Advanced tab.
    Click the Environment Variables button.
    In the System variables list, find the variable called Path, click it, then click the Edit button.
    At the end of the line, enter ;C:\python27;C:\python27\scripts. Don’t forget the semicolon - and certainly do not add a space.
    Click OK to save your changes in each window.
    Close any Command Prompt instances, open a new instance, and try run the python command again.

Then download the setuptools package from here	https://pypi.python.org/pypi/setuptools/1.1.6 . Navigate to the folder using the command cd setuptools-1.1.6(where 1.1.6 is version number),
run the command python ez_setup.py which will install setuptools. Successfully installing would look like the following - Finished processing dependencies for setuptools==1.1.6. 
Afterwards type easy_install pip which would install pip library with message for success similar to - Finished processing dependencies for pip.
	
2. Install flask - pip install Flask
3. Install httpauth - pip install flask-httpauth
4. Install werkzeug -  pip install Werkzeug
5. Install sqlite (used for project development - sqlite3) - http://www.sqlite.org/download.html

In order to get the project up and running you need to navigate using the command line to the main folder where python file todo.py is located. Then run python todo.py and the server
should be running. Go to http://127.0.0.1:5000/signup and create your own account in order to start exploring the app.
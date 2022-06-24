from setuptools import setup, find_packages
from os import path
here = path.abspath(path.dirname(__file__))

# Get the long description from the relevant file
with open(path.join(here, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

setup(
    name="tunm_proto",
    version="0.1.0",
    keywords="tunm proto for Python",
    description="a binary proto like json",
    long_description=long_description,
    long_description_content_type="text/markdown",
    license="MIT Licence",
    author="tickbh",
    author_email="tickdream125@hotmail.com",
    packages=[
        'src', 
    ],
    platforms="any",
    python_requires='>=3.6',
    include_package_data=True,
    install_requires=[
    ],
    extras_require={
        'extra': ['']
    }

)
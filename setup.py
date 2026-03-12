from setuptools import setup, find_packages


HYPEN_DASH_E_DOT = '-e .'
def get_requirements(file_path):
    with open(file_path, 'r') as file:
        requirements = file.read().splitlines()
    return [req for req in requirements if req != HYPEN_DASH_E_DOT]

setup(
    name='MLPROJECT',
    version='0.1.0',
    author="Minhazul Islam Royel",
    author_email="minhazulroyel@gmail.com",
    packages=find_packages(),
    install_requires=get_requirements('requirements.txt'),
    description='A machine learning project for classification tasks.',
)
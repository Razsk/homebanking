#!/usr/bin/env python3
import subprocess

def deploy():
    print('=== 1. Building dist ===')
    subprocess.run(['python', 'scripts/build_dist.py'], check=True)
    print('=== 2. Deploying to razsk@65.108.93.59:~/sable-public ===')
    subprocess.run(['scp', '-r', 'dist/*', 'razsk@65.108.93.59:~/sable-public/'], check=True, shell=True)
    subprocess.run(['ssh', 'razsk@65.108.93.59', 'chmod -R a+rX ~/sable-public'], check=True)
    print('=== Deployment Complete! ===')

if __name__ == '__main__':
    deploy()

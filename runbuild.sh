#!/bin/bash

echo '正在部署'
git pull origin master
npm i
npm run build
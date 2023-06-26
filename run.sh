yarn install
rm -Rf platform/app/dist/*
APP_CONFIG=config/multiple.js yarn build
rm -Rf ~/ohif
mkdir ~/ohif
cp -R platform/app/dist/* ~/ohif/
aws s3 sync ~/ohif/ s3://client-deeplook/

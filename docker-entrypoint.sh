#!/bin/sh
NODE_PATH=$(npm root --quiet -g) ./config/clisaveconfig.js
exec syncloungesocket --static_path dist
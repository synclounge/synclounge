#!/bin/sh
NODE_PATH=/app/.npm-global/lib/node_modules /app/config/clisaveconfig.js
exec /app/.npm-global/bin/syncloungesocket --static_path dist
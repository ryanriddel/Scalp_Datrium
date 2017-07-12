#!/bin/bash
sh ./startMongo.sh
gnome-terminal -e "npm start" --title="nodeJS" --geometry=60x8

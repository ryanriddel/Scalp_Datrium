#!/bin/bash

gnome-terminal -e "mongod --port 21234 --dbpath data/db" --title="mongo daemon" --geometry=60x12
gnome-terminal -e "mongo --port 21234" --title="mongo" --geometry=60x12

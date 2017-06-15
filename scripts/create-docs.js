#!/usr/bin/env bash

http-server ./resources/apidoc &
watch -n10 "apidoc -i ./lib/controllers -i ./lib/helpers -o resources/apidoc"

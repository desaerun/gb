#!/bin/sh
. .env_values
template="$(cat .env_template)"
eval "echo \"${template}\"" > .env
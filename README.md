For deploy:

/etc/environment must be edited to set the following global environment variable(s):
GITHUB_BRANCH=branch_to_clone


a .env file will need to be created in ~ for the deploying user following the template syntax in .env.example


To run:
rename .env.example to .env and modify it to include your Discord API key, Youtube API key, and database information.
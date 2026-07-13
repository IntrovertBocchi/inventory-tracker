from flask_sqlalchemy import SQLAlchemy

# Split into it's own file to avoid a circular import: app.py needs to
# register routes.py, and routes.py needs the database object - if db
# lived inside app.py, routes.py would need to import a file that's
# still in the middle of loading. Defining db here, with no dependency
# on app.py, breaks that cycle. 
db = SQLAlchemy()
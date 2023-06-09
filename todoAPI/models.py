from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash
from time import time
from datetime import datetime 
import jwt

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///db.sqlite"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = "4a72e70144b77601baeff6fab3a8462a"
app.config['SECURITY_PASSWORD_SALT'] = "0mS5uWVCHu2SXLnA3XPEDA"

db = SQLAlchemy()
db.init_app(app)

class User(db.Model, UserMixin):
  id = db.Column(db.Integer(), primary_key=True)
  username = db.Column(db.String(30), nullable=False)
  password = db.Column(db.String(80), nullable=False)
  token = db.Column(db.String(200), nullable=True, default=None)
  todos = db.relationship('Todo', backref='user', lazy=True)

  @staticmethod
  def fetch(username=None):
    '''Return an obj. username parameter takes precedence '''
    return User.query.filter_by(username=username).first()

  @staticmethod
  def create_new(username, password):
    ''' password will be hashed using sha256 '''
    new_user = User(username=username, password=generate_password_hash(password, method="pbkdf2:sha256", salt_length=8))
    db.session.add(new_user)
    db.session.commit()
    return User.fetch(username)

  def check_password(self, password_to_compare):
    return check_password_hash(self.password, password_to_compare)

  @staticmethod
  def verify_session_token(token):
    try:
        tk = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    user = User.fetch(tk['username'])
    if user and user.token != token:
      user.delete_token()
      return None
    return user

  @staticmethod
  def get_request_token(request):
    auth_header = request.headers.get('Authorization')
    auth_token = auth_header.split()[1]
    return auth_token

  def get_session_token(self, expires_in=3600):
    token = jwt.encode({'username': self.username, 'id' : self.id , 'exp': time() + expires_in}, app.config['SECRET_KEY'], algorithm='HS256')
    self.token = token
    db.session.commit()
    return token 

  def delete_token(self):
    self.token = None
    db.session.commit()

  def get_todos(self):
    return self.todos
  
  def get_todo(self, todo_id):
    for todo in self.todos:
      if str(todo.id) == todo_id:
        return todo
    return None
  
  def delete_all_todos(self):
    for todo in self.todos:
      db.session.delete(todo)
    db.session.commit()
    return
  
  def delete_todo(self, todo_id):
    for todo in self.todos:
      if str(todo.id) == todo_id:
        db.session.delete(todo)
    db.session.commit()
    return
  
  def update_todo(self, todo_id, new_status):
    for todo in self.todos:
      if str(todo.id) == todo_id:
        todo.status = new_status
        db.session.commit()
        return todo
  
class Todo(db.Model):
  id = db.Column(db.Integer(), primary_key=True)
  creator_id = db.Column(db.Integer(), db.ForeignKey('user.id'), nullable=False)
  created_at = db.Column(db.DateTime(), nullable=False, default=datetime.now())
  body = db.Column(db.Text, nullable=True)
  status = db.Column(db.String(40), nullable=False)


  @staticmethod
  def fetch(todo_id=None, all=False):
    if all and not todo_id:
      return Todo.query.all()
    return Todo.query.get(todo_id).first()

  @staticmethod
  def create_new(body, creator_id, status):
    new_todo = Todo(body=body, creator_id=creator_id, status=status)
    db.session.add(new_todo)
    db.session.commit()
    return new_todo



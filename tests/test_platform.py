import os
import secrets
import tempfile
import unittest
from pathlib import Path
os.environ['JWT_SECRET']=secrets.token_hex(32)
os.environ['ADMIN_PASSWORD']=secrets.token_urlsafe(24)
from backend import users
_TEMP=tempfile.TemporaryDirectory()
users.DB_PATH=Path(_TEMP.name)/'users.db'
from backend.main import app
from fastapi.testclient import TestClient

class PlatformTests(unittest.TestCase):
    def setUp(self):self.client=TestClient(app)
    def login(self,username='admin',password=None):
        return self.client.post('/api/auth/login',json={'username':username,'password':password or os.environ['ADMIN_PASSWORD']})
    def test_protected_endpoint(self):self.assertEqual(self.client.get('/api/apps').status_code,401)
    def test_admin_login(self):
        self.assertEqual(self.login().status_code,200)
        self.assertTrue(self.client.get('/api/admin/users').json()['users'])
    def test_bad_password(self):self.assertEqual(self.login(password='incorrect').status_code,401)
    def test_module_discovery(self):
        self.login()
        self.assertIn('example',[x['id'] for x in self.client.get('/api/apps').json()['apps']])
    def test_module_execution(self):
        self.login()
        response=self.client.post('/api/example/analyse',json={'text':'two words'})
        self.assertEqual(response.json(),{'characters':9,'words':2})
    def test_app_restriction(self):
        password=secrets.token_urlsafe(24)
        users.create_user('restricted',password,allowed_apps=[])
        self.login('restricted',password)
        self.assertEqual(self.client.post('/api/example/analyse',json={'text':'x'}).status_code,403)
    def test_disabled_user_session_revoked(self):
        password=secrets.token_urlsafe(24)
        uid=users.create_user('disabled-test',password)
        self.login('disabled-test',password)
        users.update_user(uid,is_active=False)
        self.assertEqual(self.client.get('/api/apps').status_code,401)
    def test_logout(self):
        self.login()
        self.client.post('/api/auth/logout')
        self.assertEqual(self.client.get('/api/apps').status_code,401)
if __name__=='__main__':unittest.main()

// backend/user-authentication/models/userModel.js
import db from '../database.js';

export function findUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, email, password_hash FROM users WHERE email = ?',
      [email],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
}

export function createUser(email, passwordHash) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, email });
      }
    );
  });
}

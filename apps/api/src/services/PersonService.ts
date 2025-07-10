import { v4 as uuid } from 'uuid';
import { getMySQLPool } from '../database/connection';

export default {
  async findById(id: string) {
    const [rows] = await getMySQLPool().query('SELECT * FROM persons WHERE id=?', [id]);
    return (rows as any[])[0] || null;
  },

  async allByUser(userId: number) {
    const [rows] = await getMySQLPool().query('SELECT * FROM persons WHERE user_id=?', [userId]);
    return rows as any[];
  },

  async create(data: any, userId: number) {
    const id = uuid();
    await getMySQLPool().query('INSERT INTO persons SET ?', { id, user_id: userId, ...data });
    return { id, ...data };
  },

  async familyConnections(personId: string) {
    const pool = getMySQLPool();
    const [rows] = await pool.query(
      `SELECT r.rel_type, p.* 
         FROM relationships r 
         JOIN persons p ON (p.id = IF(r.person_id_1=? , r.person_id_2 , r.person_id_1))
        WHERE r.person_id_1=? OR r.person_id_2=?`,
      [personId, personId, personId]
    );
    return rows as any[];
  }
}; 
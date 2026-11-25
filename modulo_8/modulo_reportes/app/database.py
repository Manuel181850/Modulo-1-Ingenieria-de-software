import os
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

USE_SQLITE = os.getenv("USE_SQLITE", "true").lower() == "true"

def _init_sqlite_db(db_path: str):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS usuarios (id_usuario INTEGER PRIMARY KEY);

        CREATE TABLE IF NOT EXISTS casos (
            id_caso INTEGER PRIMARY KEY AUTOINCREMENT,
            numero_caso TEXT NOT NULL UNIQUE,
            titulo TEXT NOT NULL,
            descripcion TEXT NOT NULL,
            entidad_afectada TEXT,
            categoria_delito TEXT NOT NULL,
            prioridad TEXT NOT NULL,
            estatus TEXT NOT NULL DEFAULT 'ABIERTO',
            fecha_apertura TEXT NOT NULL,
            fecha_cierre TEXT NULL,
            id_usuario_creador INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS asignaciones_caso (
            id_asignacion INTEGER PRIMARY KEY AUTOINCREMENT,
            id_caso INTEGER NOT NULL,
            id_usuario INTEGER NOT NULL,
            rol_en_caso TEXT NOT NULL,
            activo INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS bitacora_auditoria (
            id_bitacora INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha_evento TEXT NOT NULL,
            id_usuario INTEGER NULL,
            modulo TEXT NOT NULL,
            accion TEXT NOT NULL,
            entidad TEXT NULL,
            id_entidad TEXT NULL,
            id_caso INTEGER NULL,
            ip_origen TEXT NULL
        );

        CREATE TABLE IF NOT EXISTS rep_historial_reportes_generados (
            id_reporte_generado INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario_solicitante INTEGER NOT NULL,
            tipo_reporte TEXT NOT NULL,
            formato_exportacion TEXT NOT NULL,
            parametros_filtro TEXT,
            fecha_generacion TEXT DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("SELECT COUNT(*) FROM casos")
    if cur.fetchone()[0] == 0:
        cur.executescript("""
            INSERT INTO usuarios (id_usuario) VALUES (1), (2), (3);

            INSERT INTO casos (numero_caso, titulo, descripcion, entidad_afectada, categoria_delito, prioridad, estatus, fecha_apertura, fecha_cierre, id_usuario_creador) VALUES
            ('UDINT-2026-0001', 'Fraude en dominio institucional', 'Suplantacion de portal', 'dominio-falso.edu.mx', 'Phishing', 'ALTA', 'EN INVESTIGACION', '2026-11-18 10:30:00', NULL, 1),
            ('UDINT-2026-0002', 'Perfil falso en redes sociales', 'Cuenta apocrifa', '@usuario_falso_test', 'Suplantacion', 'CRITICA', 'ABIERTO', '2026-11-21 14:15:00', NULL, 1),
            ('UDINT-2026-0003', 'Filtracion de credenciales', 'Paste publico simulado', 'test@ejemplo.org', 'Fuga de datos', 'MEDIA', 'CERRADO', '2026-11-10 09:00:00', '2026-11-14 09:00:00', 2),
            ('UDINT-2026-0004', 'Analisis de telefono sospechoso', 'Rastreo OSINT de linea', '+524440000000', 'Extorsion', 'BAJA', 'CERRADO', '2026-11-12 11:00:00', '2026-11-16 11:00:00', 2);

            INSERT INTO asignaciones_caso (id_caso, id_usuario, rol_en_caso, activo) VALUES
            (1, 2, 'CAPTURISTA', 1),
            (2, 3, 'CAPTURISTA', 1),
            (3, 2, 'INVESTIGADOR', 1),
            (4, 3, 'CAPTURISTA', 1);

            INSERT INTO bitacora_auditoria (fecha_evento, id_usuario, modulo, accion, entidad, id_entidad, id_caso, ip_origen) VALUES
            ('2026-11-22 08:15:00', 1, 'AUTH', 'LOGIN', 'usuarios', '1', NULL, '192.168.1.10'),
            ('2026-11-22 08:20:00', 1, 'ADMINISTRADOR', 'CREAR_CASO', 'casos', '1', 1, '192.168.1.10'),
            ('2026-11-22 09:05:00', 2, 'CAPTURISTA', 'CONSULTAR_CASO', 'casos', '1', 1, '192.168.1.15'),
            ('2026-11-23 10:12:00', 3, 'CONSULTOR', 'CONSULTA_LECTURA', 'casos', '2', 2, '192.168.1.22');
        """)
    conn.commit()
    conn.close()

class _SQLiteCursorWrapper:
    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query: str, params=()):
        q = query.replace("%s", "?").replace("TRUE", "1").replace("HOST(ip_origen)", "ip_origen")
        return self._cursor.execute(q, params)

    def fetchall(self):
        return [dict(row) for row in self._cursor.fetchall()]

    def fetchone(self):
        row = self._cursor.fetchone()
        return dict(row) if row else None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self._cursor.close()

class _SQLiteConnWrapper:
    def __init__(self, conn):
        self._conn = conn

    def cursor(self):
        return _SQLiteCursorWrapper(self._conn.cursor())

    def commit(self):
        self._conn.commit()

    def close(self):
        self._conn.close()

def get_db_connection():
    if USE_SQLITE:
        db_path = "udint_local.db"
        _init_sqlite_db(db_path)
        conn = sqlite3.connect(db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return _SQLiteConnWrapper(conn)

    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        dbname=os.getenv("DB_NAME", "udint_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
        cursor_factory=RealDictCursor
    )
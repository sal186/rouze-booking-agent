import Database from 'better-sqlite3';
import path from 'path';

// Database file location
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'bookings.db');

// Singleton database instance
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  // Business configuration table
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      business_name TEXT NOT NULL DEFAULT 'Your Business',
      business_email TEXT,
      business_phone TEXT,
      timezone TEXT DEFAULT 'America/New_York',
      buffer_minutes INTEGER DEFAULT 15,
      max_bookings_per_day INTEGER DEFAULT 8,
      brand_color TEXT DEFAULT '#2563eb',
      google_calendar_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Services table
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 30,
      price REAL DEFAULT 0,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Business hours table
  db.exec(`
    CREATE TABLE IF NOT EXISTS business_hours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week TEXT NOT NULL UNIQUE,
      open_time TEXT NOT NULL DEFAULT '09:00',
      close_time TEXT NOT NULL DEFAULT '17:00',
      is_enabled INTEGER DEFAULT 1
    );
  `);

  // Bookings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      booking_date TEXT NOT NULL,
      booking_time TEXT NOT NULL,
      duration INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      notes TEXT,
      status TEXT DEFAULT 'confirmed',
      google_event_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_id) REFERENCES services(id)
    );
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
  `);

  // Insert default config
  const configExists = db.prepare('SELECT COUNT(*) as count FROM config').get() as { count: number };
  if (configExists.count === 0) {
    db.prepare('INSERT INTO config (id, business_name) VALUES (1, \'Your Business\')').run();
  }

  // Insert default business hours
  const hoursExist = db.prepare('SELECT COUNT(*) as count FROM business_hours').get() as { count: number };
  if (hoursExist.count === 0) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const insertHours = db.prepare('INSERT INTO business_hours (day_of_week, open_time, close_time, is_enabled) VALUES (?, ?, ?, ?)');
    for (const day of days) {
      const isWeekend = day === 'sunday' || day === 'saturday';
      insertHours.run(day, '09:00', '17:00', isWeekend ? 0 : 1);
    }
  }

  // Insert default services
  const servicesExist = db.prepare('SELECT COUNT(*) as count FROM services').get() as { count: number };
  if (servicesExist.count === 0) {
    const insertService = db.prepare('INSERT INTO services (id, name, duration, price, sort_order) VALUES (?, ?, ?, ?, ?)');
    insertService.run('svc_intro', 'Intro Call', 30, 0, 1);
    insertService.run('svc_consult', 'Consultation', 60, 150, 2);
    insertService.run('svc_strategy', 'Strategy Session', 90, 250, 3);
  }
}

// Type definitions
export interface Config {
  id: number;
  business_name: string;
  business_email: string | null;
  business_phone: string | null;
  timezone: string;
  buffer_minutes: number;
  max_bookings_per_day: number;
  brand_color: string;
  google_calendar_id: string | null;
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string | null;
  is_active: number;
  sort_order: number;
}

export interface BusinessHours {
  id: number;
  day_of_week: string;
  open_time: string;
  close_time: string;
  is_enabled: number;
}

export interface Booking {
  id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  duration: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  notes: string | null;
  status: string;
  google_event_id: string | null;
  created_at: string;
  updated_at: string;
}

// Database helper functions
export function getConfig(): Config {
  const db = getDb();
  return db.prepare('SELECT * FROM config WHERE id = 1').get() as Config;
}

export function updateConfig(config: Partial<Config>): void {
  const db = getDb();
  const fields = Object.keys(config).filter(k => k !== 'id');
  const setClause = fields.map(f => `${f} = @${f}`).join(', ');
  db.prepare(`UPDATE config SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = 1`).run(config);
}

export function getServices(activeOnly = true): Service[] {
  const db = getDb();
  const query = activeOnly
    ? 'SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order'
    : 'SELECT * FROM services ORDER BY sort_order';
  return db.prepare(query).all() as Service[];
}

export function getService(id: string): Service | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM services WHERE id = ?').get(id) as Service | undefined;
}

export function upsertService(service: Partial<Service> & { id: string }): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO services (id, name, duration, price, description, is_active, sort_order)
    VALUES (@id, @name, @duration, @price, @description, @is_active, @sort_order)
    ON CONFLICT(id) DO UPDATE SET
      name = @name,
      duration = @duration,
      price = @price,
      description = @description,
      is_active = @is_active,
      sort_order = @sort_order
  `).run({
    id: service.id,
    name: service.name || 'New Service',
    duration: service.duration || 30,
    price: service.price || 0,
    description: service.description || null,
    is_active: service.is_active ?? 1,
    sort_order: service.sort_order || 0,
  });
}

export function deleteService(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM services WHERE id = ?').run(id);
}

export function getBusinessHours(): BusinessHours[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM business_hours
    ORDER BY CASE day_of_week
      WHEN 'sunday' THEN 0
      WHEN 'monday' THEN 1
      WHEN 'tuesday' THEN 2
      WHEN 'wednesday' THEN 3
      WHEN 'thursday' THEN 4
      WHEN 'friday' THEN 5
      WHEN 'saturday' THEN 6
    END
  `).all() as BusinessHours[];
}

export function updateBusinessHours(day: string, hours: Partial<BusinessHours>): void {
  const db = getDb();
  db.prepare(`
    UPDATE business_hours
    SET open_time = COALESCE(@open_time, open_time),
        close_time = COALESCE(@close_time, close_time),
        is_enabled = COALESCE(@is_enabled, is_enabled)
    WHERE day_of_week = @day_of_week
  `).run({ ...hours, day_of_week: day });
}

export function getBookings(filters?: { date?: string; status?: string }): Booking[] {
  const db = getDb();
  let query = 'SELECT * FROM bookings WHERE 1=1';
  const params: Record<string, string> = {};

  if (filters?.date) {
    query += ' AND booking_date = @date';
    params.date = filters.date;
  }

  if (filters?.status) {
    query += ' AND status = @status';
    params.status = filters.status;
  }

  query += ' ORDER BY booking_date, booking_time';

  return db.prepare(query).all(params) as Booking[];
}

export function getBooking(id: string): Booking | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as Booking | undefined;
}

export function createBooking(booking: Omit<Booking, 'created_at' | 'updated_at'>): Booking {
  const db = getDb();
  db.prepare(`
    INSERT INTO bookings (
      id, service_id, booking_date, booking_time, duration,
      customer_name, customer_email, customer_phone, notes, status, google_event_id
    )
    VALUES (
      @id, @service_id, @booking_date, @booking_time, @duration,
      @customer_name, @customer_email, @customer_phone, @notes, @status, @google_event_id
    )
  `).run(booking);
  return getBooking(booking.id)!;
}

export function updateBooking(id: string, updates: Partial<Booking>): void {
  const db = getDb();
  const fields = Object.keys(updates).filter(k => k !== 'id');
  const setClause = fields.map(f => `${f} = @${f}`).join(', ');
  db.prepare(`UPDATE bookings SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`).run({ ...updates, id });
}

export function cancelBooking(id: string): void {
  updateBooking(id, { status: 'cancelled' });
}

export function getAvailableSlots(date: string, serviceId: string): string[] {
  const config = getConfig();
  const service = getService(serviceId);
  if (!service) return [];

  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const hours = getBusinessHours().find(h => h.day_of_week === dayOfWeek);
  if (!hours?.is_enabled) return [];

  const existingBookings = getBookings({ date, status: 'confirmed' });
  const slots: string[] = [];

  const [openHour, openMin] = hours.open_time.split(':').map(Number);
  const [closeHour, closeMin] = hours.close_time.split(':').map(Number);

  let currentTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  while (currentTime + service.duration <= closeTime) {
    const timeStr = `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`;

    const hasConflict = existingBookings.some(b => {
      const bookingStart = parseInt(b.booking_time.split(':')[0]) * 60 + parseInt(b.booking_time.split(':')[1]);
      const bookingEnd = bookingStart + b.duration + config.buffer_minutes;
      const slotEnd = currentTime + service.duration;

      return (currentTime < bookingEnd && slotEnd > bookingStart);
    });

    if (!hasConflict && existingBookings.length < config.max_bookings_per_day) {
      slots.push(timeStr);
    }

    currentTime += 30; // 30-minute increments
  }

  return slots;
}

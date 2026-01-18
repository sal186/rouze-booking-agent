import { sql } from '@vercel/postgres';

// Booking type definition
export interface Booking {
  id: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes?: string;
    google_event_id?: string;
  created_at?: string;
}

// Service type definition
export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  is_active?: number;
  sort_order?: number;
  created_at?: string;
}

// Track initialization state
let isInitialized = false;

// Lazy initialization - only runs when actually called at runtime
async function ensureInitialized() {
  if (isInitialized) return;
  
  try {
    await initializeDb();
    isInitialized = true;
  } catch (error) {
    console.error('Database initialization error:', error);
    // Don't throw - allow retry on next request
  }
}

// Initialize database tables - NOT exported, only called via ensureInitialized
async function initializeDb() {
  // Business configuration table
  await sql`
    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY DEFAULT 1,
      business_name TEXT NOT NULL DEFAULT 'Your Business',
      business_email TEXT,
      business_phone TEXT,
      timezone TEXT DEFAULT 'America/New_York',
      buffer_minutes INTEGER DEFAULT 15,
      max_bookings_per_day INTEGER DEFAULT 8,
      brand_color TEXT DEFAULT '#2563eb',
      google_calendar_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT config_one_row CHECK (id = 1)
    )`;

  // Services table
  await sql`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 30,
      price REAL DEFAULT 0,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

  // Business hours table
  await sql`
    CREATE TABLE IF NOT EXISTS business_hours (
      id SERIAL PRIMARY KEY,
      day_of_week TEXT NOT NULL UNIQUE,
      is_open INTEGER DEFAULT 1,
      open_time TEXT,
      close_time TEXT
    )`;

  // Bookings table
  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      booking_date TEXT NOT NULL,
      booking_time TEXT NOT NULL,
      status TEXT DEFAULT 'confirmed',
      notes TEXT,
          google_event_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_id) REFERENCES services(id)
    )`;

  // Insert default config if not exists
  await sql`
    INSERT INTO config (id, business_name)
    VALUES (1, 'Your Business')
    ON CONFLICT (id) DO NOTHING`;

  // Insert default business hours if not exists
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  for (const day of days) {
    const isOpen = day !== 'Saturday' && day !== 'Sunday' ? 1 : 0;
    await sql`
      INSERT INTO business_hours (day_of_week, is_open, open_time, close_time)
      VALUES (${day}, ${isOpen}, '09:00', '17:00')
      ON CONFLICT (day_of_week) DO NOTHING`;
  }
}

// Get business configuration
export async function getConfig() {
  await ensureInitialized();
  const result = await sql`SELECT * FROM config WHERE id = 1`;
  return result.rows[0] || null;
}

// Update business configuration
export async function updateConfig(config: any) {
  await ensureInitialized();
  await sql`
    UPDATE config
    SET business_name = ${config.business_name},
        business_email = ${config.business_email},
        business_phone = ${config.business_phone},
        timezone = ${config.timezone},
        buffer_minutes = ${config.buffer_minutes},
        max_bookings_per_day = ${config.max_bookings_per_day},
        brand_color = ${config.brand_color},
        google_calendar_id = ${config.google_calendar_id},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1`;
}

// Get all services
export async function getServices() {
  await ensureInitialized();
  const result = await sql`SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order, name`;
  return result.rows;
}

// Get service by ID
export async function getServiceById(id: string) {
  await ensureInitialized();
  const result = await sql`SELECT * FROM services WHERE id = ${id}`;
  return result.rows[0] || null;
}

// Create service
export async function createService(service: any) {
  await ensureInitialized();
  await sql`
    INSERT INTO services (id, name, duration, price, description, is_active, sort_order)
    VALUES (${service.id}, ${service.name}, ${service.duration}, ${service.price}, ${service.description}, ${service.is_active}, ${service.sort_order})`;
}

// Update service
export async function updateService(id: string, service: any) {
  await ensureInitialized();
  await sql`
    UPDATE services
    SET name = ${service.name},
        duration = ${service.duration},
        price = ${service.price},
        description = ${service.description},
        is_active = ${service.is_active},
        sort_order = ${service.sort_order}
    WHERE id = ${id}`;
}

// Delete service
export async function deleteService(id: string) {
  await ensureInitialized();
  await sql`DELETE FROM services WHERE id = ${id}`;
}

// Get business hours
export async function getBusinessHours() {
  await ensureInitialized();
  const result = await sql`SELECT * FROM business_hours ORDER BY 
    CASE day_of_week
      WHEN 'Monday' THEN 1
      WHEN 'Tuesday' THEN 2
      WHEN 'Wednesday' THEN 3
      WHEN 'Thursday' THEN 4
      WHEN 'Friday' THEN 5
      WHEN 'Saturday' THEN 6
      WHEN 'Sunday' THEN 7
    END`;
  return result.rows;
}

// Update business hours
export async function updateBusinessHours(day: string, hours: any) {
  await ensureInitialized();
  await sql`
    UPDATE business_hours
    SET is_open = ${hours.is_open},
        open_time = ${hours.open_time},
        close_time = ${hours.close_time}
    WHERE day_of_week = ${day}`;
}

// Get all bookings
export async function getAllBookings(filters?: any) {
  await ensureInitialized();
  let query = 'SELECT * FROM bookings WHERE 1=1';
  const params: any[] = [];
  
  if (filters?.date) {
    query += ` AND booking_date = $${params.length + 1}`;
    params.push(filters.date);
  }
  
  if (filters?.status) {
    query += ` AND status = $${params.length + 1}`;
    params.push(filters.status);
  }
  
  query += ' ORDER BY booking_date DESC, booking_time DESC';
  
  const result = await sql.query(query, params);
  return result.rows;
}

// Get booking by ID
export async function getBookingById(id: string) {
  await ensureInitialized();
  const result = await sql`SELECT * FROM bookings WHERE id = ${id}`;
  return result.rows[0] || null;
}

// Create booking
export async function createBooking(booking: any) {
  await ensureInitialized();
  await sql`
    INSERT INTO bookings (id, service_id, customer_name, customer_email, customer_phone, booking_date, booking_time, status, notes)
    VALUES (${booking.id}, ${booking.service_id}, ${booking.customer_name}, ${booking.customer_email}, ${booking.customer_phone}, ${booking.booking_date}, ${booking.booking_time}, ${booking.status}, ${booking.notes})`;
}

// Update booking
export async function updateBooking(id: string, booking: any) {
  await ensureInitialized();
  await sql`
    UPDATE bookings
    SET service_id = ${booking.service_id},
        customer_name = ${booking.customer_name},
        customer_email = ${booking.customer_email},
        customer_phone = ${booking.customer_phone},
        booking_date = ${booking.booking_date},
        booking_time = ${booking.booking_time},
        status = ${booking.status},
        notes = ${booking.notes}
    WHERE id = ${id}`;
}

// Delete booking
export async function deleteBooking(id: string) {
  await ensureInitialized();
  await sql`DELETE FROM bookings WHERE id = ${id}`;
}

// Get bookings for a specific date
export async function getBookingsByDate(date: string) {
  await ensureInitialized();
  const result = await sql`SELECT * FROM bookings WHERE booking_date = ${date} ORDER BY booking_time`;
  return result.rows;
}

// Check if time slot is available
export async function isTimeSlotAvailable(serviceId: string, date: string, time: string) {
  await ensureInitialized();
  const result = await sql`
    SELECT COUNT(*) as count
    FROM bookings
    WHERE service_id = ${serviceId}
      AND booking_date = ${date}
      AND booking_time = ${time}
      AND status != 'cancelled'`;
  return result.rows[0].count === 0;
}

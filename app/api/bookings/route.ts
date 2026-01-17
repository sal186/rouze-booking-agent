import { NextRequest, NextResponse } from 'next/server';
import { createBooking, getAllBookings } from '@/lib/db';
import { sendBookingConfirmation } from '@/lib/email';

// Force dynamic rendering - prevents build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SERVICES = {
  haircut: { name: 'Haircut', duration: 30, price: 50 },
  coloring: { name: 'Hair Coloring', duration: 90, price: 120 },
  styling: { name: 'Hair Styling', duration: 45, price: 60 },
  treatment: { name: 'Hair Treatment', duration: 60, price: 80 },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, date, time, customerName, customerEmail, customerPhone } = body;

    // Validate required fields
    if (!serviceId || !date || !time || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get service details
    const service = SERVICES[serviceId as keyof typeof SERVICES];
    if (!service) {
      return NextResponse.json(
        { error: 'Invalid service' },
        { status: 400 }
      );
    }

    // Create booking in database
          // Generate unique booking ID
    const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare booking data matching Booking interface
    const bookingData = {
      id: bookingId,
      service_id: serviceId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      booking_date: date,
      booking_time: time,
      status: 'confirmed' as const,
    };
    
    // Save to database
    await createBooking(bookingData);
    // Send confirmation email
    try {
      await sendBookingConfirmation(booking, service);
        } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the booking if email fails
    }

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const bookings = getAllBookings();
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

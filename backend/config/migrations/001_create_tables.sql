-- Create database schema for Muayene ve Raporlama Sistemi

-- Companies (Muayene Firmaları)
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tax_number VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    contact VARCHAR(255),
    logo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Technicians (Teknisyenler)
CREATE TABLE technicians (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    e_signature_pin VARCHAR(255),
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer Companies (Müşteri Firmaları)
CREATE TABLE customer_companies (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tax_number VARCHAR(50),
    address TEXT,
    contact VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    authorized_person VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment (Ekipmanlar)
CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    template JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Offers (İş Teklifleri)
CREATE TABLE offers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    offer_number VARCHAR(50) UNIQUE NOT NULL,
    customer_company_id INTEGER NOT NULL REFERENCES customer_companies(id),
    status VARCHAR(50) DEFAULT 'pending',
    items JSONB NOT NULL,
    notes TEXT,
    total_amount DECIMAL(10,2),
    tracking_token VARCHAR(255) UNIQUE,
    created_by INTEGER NOT NULL REFERENCES technicians(id),
    approved_by INTEGER REFERENCES technicians(id),
    approved_at TIMESTAMP,
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work Orders (İş Emirleri)
CREATE TABLE work_orders (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    work_order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_company_id INTEGER NOT NULL REFERENCES customer_companies(id),
    offer_id INTEGER REFERENCES offers(id),
    status VARCHAR(50) DEFAULT 'not_started',
    scheduled_date DATE,
    notes TEXT,
    created_by INTEGER NOT NULL REFERENCES technicians(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work Order Assignments (İş Emri Atamaları)
CREATE TABLE work_order_assignments (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    technician_id INTEGER NOT NULL REFERENCES technicians(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(work_order_id, technician_id)
);

-- Inspections (Muayeneler)
CREATE TABLE inspections (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    equipment_id INTEGER NOT NULL REFERENCES equipment(id),
    technician_id INTEGER NOT NULL REFERENCES technicians(id),
    inspection_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'not_started',
    inspection_data JSONB DEFAULT '{}',
    photo_urls JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_time_slot UNIQUE (technician_id, inspection_date, start_time, end_time)
);

-- Reports (Raporlar)
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    inspection_id INTEGER NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    is_signed BOOLEAN DEFAULT false,
    signed_at TIMESTAMP,
    signed_by INTEGER REFERENCES technicians(id),
    qr_token VARCHAR(255) UNIQUE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_technicians_company_id ON technicians(company_id);
CREATE INDEX idx_technicians_email ON technicians(email);
CREATE INDEX idx_customer_companies_company_id ON customer_companies(company_id);
CREATE INDEX idx_equipment_company_id ON equipment(company_id);
CREATE INDEX idx_offers_company_id ON offers(company_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_work_orders_company_id ON work_orders(company_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_inspections_work_order_id ON inspections(work_order_id);
CREATE INDEX idx_inspections_technician_id ON inspections(technician_id);
CREATE INDEX idx_inspections_date ON inspections(inspection_date);
CREATE INDEX idx_reports_inspection_id ON reports(inspection_id);
CREATE INDEX idx_reports_qr_token ON reports(qr_token);

-- Create trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_companies_updated_at BEFORE UPDATE ON customer_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

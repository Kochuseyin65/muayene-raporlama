-- Seed data for development and testing

-- Insert sample company
INSERT INTO companies (name, tax_number, address, contact, logo_url) VALUES 
('ABC Mühendislik A.Ş.', '1234567890', 'İstanbul Ticaret Merkezi No: 123', '+90 212 555 0123', NULL);

-- Get the company ID for further inserts
DO $$
DECLARE
    company_id_val INTEGER;
    super_admin_id INTEGER;
    admin_id INTEGER;
    tech_id INTEGER;
BEGIN
    -- Get company ID
    SELECT id INTO company_id_val FROM companies WHERE tax_number = '1234567890';
    
    -- Insert super admin (for system management)
    INSERT INTO technicians (company_id, name, surname, email, phone, password_hash, permissions) VALUES
    (company_id_val, 'Süper', 'Admin', 'superadmin@abc.com', '+90 555 0001', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '["superAdmin"]')
    RETURNING id INTO super_admin_id;
    
    -- Insert company admin
    INSERT INTO technicians (company_id, name, surname, email, phone, password_hash, permissions) VALUES
    (company_id_val, 'Firma', 'Admin', 'admin@abc.com', '+90 555 0002', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '["companyAdmin", "viewTechnicians", "createTechnician", "editTechnician", "viewCustomers", "createCustomer", "editCustomer", "viewEquipment", "createEquipment", "editEquipment", "viewOffers", "createOffer", "editOffer", "approveOffer", "sendOffer", "viewWorkOrders", "createWorkOrder", "editWorkOrder", "assignWorkOrder", "updateWorkOrderStatus", "viewInspections", "editInspection", "saveInspection", "completeInspection", "uploadPhotos", "viewReports", "downloadReports", "signReports", "sendReports", "viewDashboard", "viewCalendar"]')
    RETURNING id INTO admin_id;
    
    -- Insert sample technician
    INSERT INTO technicians (company_id, name, surname, email, phone, password_hash, e_signature_pin, permissions) VALUES
    (company_id_val, 'Ahmet', 'Yılmaz', 'ahmet@abc.com', '+90 555 0003', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123456', '["viewInspections", "editInspection", "saveInspection", "completeInspection", "uploadPhotos", "viewReports", "downloadReports", "signReports", "viewCalendar"]')
    RETURNING id INTO tech_id;
    
    -- Insert sample customer company
    INSERT INTO customer_companies (company_id, name, tax_number, address, contact, email, authorized_person) VALUES
    (company_id_val, 'XYZ İnşaat Ltd.Şti.', '9876543210', 'Ankara Sanayi Sitesi No: 456', '+90 312 555 0456', 'info@xyz.com', 'Mehmet Demir');
    
    -- Insert sample equipment templates
    INSERT INTO equipment (company_id, name, type, template) VALUES
    (company_id_val, 'Kule Vinç', 'vinc', '{
        "sections": [
            {
                "title": "Genel Bilgiler",
                "fields": [
                    {
                        "name": "muayene_tarihi",
                        "type": "date",
                        "label": "Muayene Tarihi",
                        "required": true
                    },
                    {
                        "name": "muayene_yeri",
                        "type": "text",
                        "label": "Muayene Yeri",
                        "required": true
                    },
                    {
                        "name": "seri_no",
                        "type": "text",
                        "label": "Seri Numarası",
                        "required": true
                    }
                ]
            },
            {
                "title": "Teknik Bilgiler",
                "fields": [
                    {
                        "name": "tonaj",
                        "type": "number",
                        "label": "Tonaj (ton)",
                        "required": true
                    },
                    {
                        "name": "yukseklik",
                        "type": "number",
                        "label": "Yükseklik (m)",
                        "required": true
                    },
                    {
                        "name": "motor_gucu",
                        "type": "number",
                        "label": "Motor Gücü (kW)",
                        "required": false
                    }
                ]
            },
            {
                "title": "Güvenlik Kontrolleri",
                "fields": [
                    {
                        "name": "emniyet_sistemi",
                        "type": "select",
                        "label": "Emniyet Sistemi",
                        "options": ["Uygun", "Uygun Değil", "Eksik"],
                        "required": true
                    },
                    {
                        "name": "fren_sistemi",
                        "type": "select",
                        "label": "Fren Sistemi",
                        "options": ["Uygun", "Uygun Değil", "Bakım Gerekli"],
                        "required": true
                    }
                ]
            },
            {
                "title": "Fotoğraflar",
                "fields": [
                    {
                        "name": "genel_gorunum",
                        "type": "photo",
                        "label": "Genel Görünüm",
                        "required": true
                    },
                    {
                        "name": "emniyet_sistemi_foto",
                        "type": "photo",
                        "label": "Emniyet Sistemi",
                        "required": false
                    }
                ]
            }
        ]
    }'),
    (company_id_val, 'Basınçlı Hava Tankı', 'tank', '{
        "sections": [
            {
                "title": "Genel Bilgiler",
                "fields": [
                    {
                        "name": "muayene_tarihi",
                        "type": "date",
                        "label": "Muayene Tarihi",
                        "required": true
                    },
                    {
                        "name": "muayene_yeri",
                        "type": "text",
                        "label": "Muayene Yeri",
                        "required": true
                    },
                    {
                        "name": "imalat_yili",
                        "type": "number",
                        "label": "İmalat Yılı",
                        "required": true
                    }
                ]
            },
            {
                "title": "Teknik Özellikler",
                "fields": [
                    {
                        "name": "hacim",
                        "type": "number",
                        "label": "Hacim (L)",
                        "required": true
                    },
                    {
                        "name": "max_basinc",
                        "type": "number",
                        "label": "Maksimum Basınç (bar)",
                        "required": true
                    },
                    {
                        "name": "malzeme",
                        "type": "text",
                        "label": "Malzeme",
                        "required": true
                    }
                ]
            },
            {
                "title": "Test Sonuçları",
                "fields": [
                    {
                        "name": "hidrolik_test",
                        "type": "table",
                        "label": "Hidrolik Test Sonuçları",
                        "columns": [
                            {"name": "test_basinci", "label": "Test Basıncı (bar)", "type": "number"},
                            {"name": "sonuc", "label": "Sonuç", "type": "select", "options": ["Başarılı", "Başarısız"]}
                        ],
                        "required": true
                    }
                ]
            }
        ]
    }');
    
END $$;
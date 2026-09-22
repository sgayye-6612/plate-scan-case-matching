from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)

    users = relationship("User", back_populates="tenant")
    cameras = relationship("Camera", back_populates="tenant")
    cases = relationship("Case", back_populates="tenant")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="staff")

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    tenant = relationship("Tenant", back_populates="users")
    claimed_cases = relationship("Case", back_populates="claimed_by_user")


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True)
    camera_id = Column(String, unique=True, nullable=False)

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    tenant = relationship("Tenant", back_populates="cameras")
    scans = relationship("Scan", back_populates="camera")


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True)
    vin = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending_claim")

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)
    claimed_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    tenant = relationship("Tenant", back_populates="cases")
    claimed_by_user = relationship("User", back_populates="claimed_cases")


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)

    plate = Column(String, nullable=False)
    vin = Column(String, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    scanned_at = Column(DateTime, nullable=False)
    image_url = Column(String)

    camera = relationship("Camera", back_populates="scans")
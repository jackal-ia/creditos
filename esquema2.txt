--
-- PostgreSQL database dump
--

\restrict BiXQA1EmHF56W9ucTyUmf78amb8TM5gUtLcOAXHq1IFPrWBL0y54hwRvUNyLobL

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: registrar_auditoria(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.registrar_auditoria() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO auditoria_usuarios (usuario_id, usuario_accion_id, accion, datos_nuevos)
        VALUES (NEW.id, NULL, 'CREAR', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO auditoria_usuarios (usuario_id, usuario_accion_id, accion, datos_anteriores, datos_nuevos)
        VALUES (NEW.id, NULL, 'ACTUALIZAR', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO auditoria_usuarios (usuario_id, usuario_accion_id, accion, datos_anteriores)
        VALUES (OLD.id, NULL, 'ELIMINAR', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.registrar_auditoria() OWNER TO postgres;

--
-- Name: update_tienda_maracay_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_tienda_maracay_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_tienda_maracay_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: actividades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actividades (
    id integer NOT NULL,
    descripcion character varying(255) NOT NULL,
    descripcion_extra text,
    hora time without time zone NOT NULL,
    prioridad character varying(20) NOT NULL,
    tienda character varying(20) NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_completada timestamp without time zone,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    creado_por integer,
    completado_por integer,
    CONSTRAINT actividades_estado_check CHECK (((estado)::text = ANY (ARRAY[('pendiente'::character varying)::text, ('completada'::character varying)::text]))),
    CONSTRAINT actividades_prioridad_check CHECK (((prioridad)::text = ANY (ARRAY[('baja'::character varying)::text, ('media'::character varying)::text, ('alta'::character varying)::text, ('urgente'::character varying)::text]))),
    CONSTRAINT actividades_tienda_check CHECK (((tienda)::text = ANY (ARRAY[('caracas'::character varying)::text, ('maracay'::character varying)::text, ('maracaibo'::character varying)::text])))
);


ALTER TABLE public.actividades OWNER TO postgres;

--
-- Name: actividades_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.actividades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.actividades_id_seq OWNER TO postgres;

--
-- Name: actividades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.actividades_id_seq OWNED BY public.actividades.id;


--
-- Name: auditoria_usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auditoria_usuarios (
    id integer NOT NULL,
    usuario_id integer,
    usuario_accion_id integer,
    accion character varying(50) NOT NULL,
    tabla_afectada character varying(50) DEFAULT 'usuarios'::character varying,
    datos_anteriores jsonb,
    datos_nuevos jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.auditoria_usuarios OWNER TO postgres;

--
-- Name: auditoria_usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auditoria_usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_usuarios_id_seq OWNER TO postgres;

--
-- Name: auditoria_usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditoria_usuarios_id_seq OWNED BY public.auditoria_usuarios.id;


--
-- Name: reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reset_tokens (
    id integer NOT NULL,
    usuario_id integer,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.reset_tokens OWNER TO postgres;

--
-- Name: reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reset_tokens_id_seq OWNER TO postgres;

--
-- Name: reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reset_tokens_id_seq OWNED BY public.reset_tokens.id;


--
-- Name: sesiones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sesiones (
    id integer NOT NULL,
    usuario_id integer,
    token character varying(500) NOT NULL,
    dispositivo character varying(200),
    ip_address character varying(45),
    ultima_actividad timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone NOT NULL,
    activa boolean DEFAULT true
);


ALTER TABLE public.sesiones OWNER TO postgres;

--
-- Name: sesiones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sesiones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sesiones_id_seq OWNER TO postgres;

--
-- Name: sesiones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sesiones_id_seq OWNED BY public.sesiones.id;


--
-- Name: tienda_caracas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tienda_caracas (
    id integer NOT NULL,
    numero integer,
    nro_factura character varying(50),
    nombre_apellido character varying(255),
    monto_factura numeric(15,2),
    fecha_factura date,
    cedula character varying(20),
    telefono character varying(20),
    monto_facturado_divisa numeric(15,2),
    cuotas integer DEFAULT 11,
    monto_pendiente numeric(15,2),
    monto_depositados numeric(15,2),
    deuda numeric(15,2),
    cuota_1 numeric(15,2),
    ref_cuota_1 character varying(50),
    fecha_cuota_1 date,
    tasa_cuota_1 numeric(15,4),
    dolar_depositado_cuota_1 numeric(15,2),
    cuota_2 numeric(15,2),
    ref_cuota_2 character varying(50),
    fecha_cuota_2 date,
    tasa_cuota_2 numeric(15,4),
    dolar_depositado_cuota_2 numeric(15,2),
    cuota_3 numeric(15,2),
    ref_cuota_3 character varying(50),
    fecha_cuota_3 date,
    tasa_cuota_3 numeric(15,4),
    dolar_depositado_cuota_3 numeric(15,2),
    cuota_4 numeric(15,2),
    ref_cuota_4 character varying(50),
    fecha_cuota_4 date,
    tasa_cuota_4 numeric(15,4),
    dolar_depositado_cuota_4 numeric(15,2),
    cuota_5 numeric(15,2),
    ref_cuota_5 character varying(50),
    fecha_cuota_5 date,
    tasa_cuota_5 numeric(15,4),
    dolar_depositado_cuota_5 numeric(15,2),
    cuota_6 numeric(15,2),
    ref_cuota_6 character varying(50),
    fecha_cuota_6 date,
    tasa_cuota_6 numeric(15,4),
    dolar_depositado_cuota_6 numeric(15,2),
    cuota_7 numeric(15,2),
    ref_cuota_7 character varying(50),
    fecha_cuota_7 date,
    tasa_cuota_7 numeric(15,4),
    dolar_depositado_cuota_7 numeric(15,2),
    cuota_8 numeric(15,2),
    ref_cuota_8 character varying(50),
    fecha_cuota_8 date,
    tasa_cuota_8 numeric(15,4),
    dolar_depositado_cuota_8 numeric(15,2),
    cuota_9 numeric(15,2),
    ref_cuota_9 character varying(50),
    fecha_cuota_9 date,
    tasa_cuota_9 numeric(15,4),
    dolar_depositado_cuota_9 numeric(15,2),
    cuota_10 numeric(15,2),
    ref_cuota_10 character varying(50),
    fecha_cuota_10 date,
    tasa_cuota_10 numeric(15,4),
    dolar_depositado_cuota_10 numeric(15,2),
    cuota_11 numeric(15,2),
    ref_cuota_11 character varying(50),
    fecha_cuota_11 date,
    tasa_cuota_11 numeric(15,4),
    dolar_depositado_cuota_11 numeric(15,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    dolar_facturado numeric(15,2)
);


ALTER TABLE public.tienda_caracas OWNER TO postgres;

--
-- Name: tienda_caracas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tienda_caracas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tienda_caracas_id_seq OWNER TO postgres;

--
-- Name: tienda_caracas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tienda_caracas_id_seq OWNED BY public.tienda_caracas.id;


--
-- Name: tienda_maracaibo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tienda_maracaibo (
    id integer NOT NULL,
    numero integer,
    nro_factura character varying(50),
    nombre_apellido character varying(200),
    monto_factura numeric(15,2),
    fecha_factura date,
    cedula character varying(20),
    telefono character varying(20),
    monto_facturado_divisa numeric(15,2),
    dolar_facturado numeric(15,2),
    cuotas integer,
    monto_pendiente numeric(15,2),
    monto_depositados numeric(15,2),
    deuda numeric(15,2),
    cuota_1 numeric(15,2),
    ref_cuota_1 character varying(100),
    fecha_cuota_1 date,
    tasa_cuota_1 numeric(15,4),
    dolar_depositado_cuota_1 numeric(15,2),
    cuota_2 numeric(15,2),
    ref_cuota_2 character varying(100),
    fecha_cuota_2 date,
    tasa_cuota_2 numeric(15,4),
    dolar_depositado_cuota_2 numeric(15,2),
    cuota_3 numeric(15,2),
    ref_cuota_3 character varying(100),
    fecha_cuota_3 date,
    tasa_cuota_3 numeric(15,4),
    dolar_depositado_cuota_3 numeric(15,2),
    cuota_4 numeric(15,2),
    ref_cuota_4 character varying(100),
    fecha_cuota_4 date,
    tasa_cuota_4 numeric(15,4),
    dolar_depositado_cuota_4 numeric(15,2),
    cuota_5 numeric(15,2),
    ref_cuota_5 character varying(100),
    fecha_cuota_5 date,
    tasa_cuota_5 numeric(15,4),
    dolar_depositado_cuota_5 numeric(15,2),
    cuota_6 numeric(15,2),
    ref_cuota_6 character varying(100),
    fecha_cuota_6 date,
    tasa_cuota_6 numeric(15,4),
    dolar_depositado_cuota_6 numeric(15,2),
    cuota_7 numeric(15,2),
    ref_cuota_7 character varying(100),
    fecha_cuota_7 date,
    tasa_cuota_7 numeric(15,4),
    dolar_depositado_cuota_7 numeric(15,2),
    cuota_8 numeric(15,2),
    ref_cuota_8 character varying(100),
    fecha_cuota_8 date,
    tasa_cuota_8 numeric(15,4),
    dolar_depositado_cuota_8 numeric(15,2),
    cuota_9 numeric(15,2),
    ref_cuota_9 character varying(100),
    fecha_cuota_9 date,
    tasa_cuota_9 numeric(15,4),
    dolar_depositado_cuota_9 numeric(15,2),
    cuota_10 numeric(15,2),
    ref_cuota_10 character varying(100),
    fecha_cuota_10 date,
    tasa_cuota_10 numeric(15,4),
    dolar_depositado_cuota_10 numeric(15,2),
    cuota_11 numeric(15,2),
    ref_cuota_11 character varying(100),
    fecha_cuota_11 date,
    tasa_cuota_11 numeric(15,4),
    dolar_depositado_cuota_11 numeric(15,2),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tienda_maracaibo OWNER TO postgres;

--
-- Name: tienda_maracaibo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tienda_maracaibo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tienda_maracaibo_id_seq OWNER TO postgres;

--
-- Name: tienda_maracaibo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tienda_maracaibo_id_seq OWNED BY public.tienda_maracaibo.id;


--
-- Name: tienda_maracay; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tienda_maracay (
    id integer NOT NULL,
    numero integer,
    nro_factura character varying(50),
    nombre_apellido character varying(200),
    monto_factura numeric(15,2),
    fecha_factura date,
    cedula character varying(20),
    telefono character varying(20),
    monto_facturado_divisa numeric(15,2),
    dolar_facturado numeric(15,2),
    cuotas integer DEFAULT 11,
    monto_pendiente numeric(15,2),
    monto_depositados numeric(15,2),
    deuda numeric(15,2),
    cuota_1 numeric(15,2),
    ref_cuota_1 character varying(100),
    fecha_cuota_1 date,
    tasa_cuota_1 numeric(15,4),
    dolar_depositado_cuota_1 numeric(15,2),
    cuota_2 numeric(15,2),
    ref_cuota_2 character varying(100),
    fecha_cuota_2 date,
    tasa_cuota_2 numeric(15,4),
    dolar_depositado_cuota_2 numeric(15,2),
    cuota_3 numeric(15,2),
    ref_cuota_3 character varying(100),
    fecha_cuota_3 date,
    tasa_cuota_3 numeric(15,4),
    dolar_depositado_cuota_3 numeric(15,2),
    cuota_4 numeric(15,2),
    ref_cuota_4 character varying(100),
    fecha_cuota_4 date,
    tasa_cuota_4 numeric(15,4),
    dolar_depositado_cuota_4 numeric(15,2),
    cuota_5 numeric(15,2),
    ref_cuota_5 character varying(100),
    fecha_cuota_5 date,
    tasa_cuota_5 numeric(15,4),
    dolar_depositado_cuota_5 numeric(15,2),
    cuota_6 numeric(15,2),
    ref_cuota_6 character varying(100),
    fecha_cuota_6 date,
    tasa_cuota_6 numeric(15,4),
    dolar_depositado_cuota_6 numeric(15,2),
    cuota_7 numeric(15,2),
    ref_cuota_7 character varying(100),
    fecha_cuota_7 date,
    tasa_cuota_7 numeric(15,4),
    dolar_depositado_cuota_7 numeric(15,2),
    cuota_8 numeric(15,2),
    ref_cuota_8 character varying(100),
    fecha_cuota_8 date,
    tasa_cuota_8 numeric(15,4),
    dolar_depositado_cuota_8 numeric(15,2),
    cuota_9 numeric(15,2),
    ref_cuota_9 character varying(100),
    fecha_cuota_9 date,
    tasa_cuota_9 numeric(15,4),
    dolar_depositado_cuota_9 numeric(15,2),
    cuota_10 numeric(15,2),
    ref_cuota_10 character varying(100),
    fecha_cuota_10 date,
    tasa_cuota_10 numeric(15,4),
    dolar_depositado_cuota_10 numeric(15,2),
    cuota_11 numeric(15,2),
    ref_cuota_11 character varying(100),
    fecha_cuota_11 date,
    tasa_cuota_11 numeric(15,4),
    dolar_depositado_cuota_11 numeric(15,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tienda_maracay OWNER TO postgres;

--
-- Name: TABLE tienda_maracay; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.tienda_maracay IS 'Tabla de clientes y cuotas de Tienda Maracay - Misma estructura que tienda_caracas';


--
-- Name: COLUMN tienda_maracay.monto_factura; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tienda_maracay.monto_factura IS 'Monto total de la factura en Bs';


--
-- Name: COLUMN tienda_maracay.monto_depositados; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tienda_maracay.monto_depositados IS 'Suma total de cuotas pagadas';


--
-- Name: COLUMN tienda_maracay.deuda; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tienda_maracay.deuda IS 'Monto_factura - monto_depositados';


--
-- Name: COLUMN tienda_maracay.dolar_depositado_cuota_1; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tienda_maracay.dolar_depositado_cuota_1 IS 'Monto de cuota / tasa BCV';


--
-- Name: tienda_maracay_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tienda_maracay_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tienda_maracay_id_seq OWNER TO postgres;

--
-- Name: tienda_maracay_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tienda_maracay_id_seq OWNED BY public.tienda_maracay.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    rol character varying(20) DEFAULT 'operador'::character varying,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    ip_asignada character varying(45) DEFAULT NULL::character varying,
    tienda character varying(20),
    token_version integer DEFAULT 0 NOT NULL,
    CONSTRAINT usuarios_rol_check CHECK (((rol)::text = ANY (ARRAY[('administrador'::character varying)::text, ('operador'::character varying)::text])))
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: actividades id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades ALTER COLUMN id SET DEFAULT nextval('public.actividades_id_seq'::regclass);


--
-- Name: auditoria_usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_usuarios ALTER COLUMN id SET DEFAULT nextval('public.auditoria_usuarios_id_seq'::regclass);


--
-- Name: reset_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.reset_tokens_id_seq'::regclass);


--
-- Name: sesiones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesiones ALTER COLUMN id SET DEFAULT nextval('public.sesiones_id_seq'::regclass);


--
-- Name: tienda_caracas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tienda_caracas ALTER COLUMN id SET DEFAULT nextval('public.tienda_caracas_id_seq'::regclass);


--
-- Name: tienda_maracaibo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tienda_maracaibo ALTER COLUMN id SET DEFAULT nextval('public.tienda_maracaibo_id_seq'::regclass);


--
-- Name: tienda_maracay id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tienda_maracay ALTER COLUMN id SET DEFAULT nextval('public.tienda_maracay_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: actividades actividades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_pkey PRIMARY KEY (id);


--
-- Name: auditoria_usuarios auditoria_usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_usuarios
    ADD CONSTRAINT auditoria_usuarios_pkey PRIMARY KEY (id);


--
-- Name: reset_tokens reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reset_tokens
    ADD CONSTRAINT reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: sesiones sesiones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesiones
    ADD CONSTRAINT sesiones_pkey PRIMARY KEY (id);


--
-- Name: tienda_caracas tienda_caracas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tienda_caracas
    ADD CONSTRAINT tienda_caracas_pkey PRIMARY KEY (id);


--
-- Name: tienda_maracaibo tienda_maracaibo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tienda_maracaibo
    ADD CONSTRAINT tienda_maracaibo_pkey PRIMARY KEY (id);


--
-- Name: tienda_maracay tienda_maracay_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tienda_maracay
    ADD CONSTRAINT tienda_maracay_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_actividades_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actividades_estado ON public.actividades USING btree (estado);


--
-- Name: idx_actividades_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actividades_fecha ON public.actividades USING btree (fecha);


--
-- Name: idx_actividades_fecha_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actividades_fecha_estado ON public.actividades USING btree (fecha, estado);


--
-- Name: idx_actividades_tienda; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actividades_tienda ON public.actividades USING btree (tienda);


--
-- Name: idx_auditoria_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_fecha ON public.auditoria_usuarios USING btree (created_at DESC);


--
-- Name: idx_auditoria_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_usuario ON public.auditoria_usuarios USING btree (usuario_id);


--
-- Name: idx_cedula; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cedula ON public.tienda_caracas USING btree (cedula);


--
-- Name: idx_maracay_cedula; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maracay_cedula ON public.tienda_maracay USING btree (cedula);


--
-- Name: idx_maracay_deuda; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maracay_deuda ON public.tienda_maracay USING btree (deuda);


--
-- Name: idx_maracay_fecha_factura; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maracay_fecha_factura ON public.tienda_maracay USING btree (fecha_factura);


--
-- Name: idx_maracay_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maracay_nombre ON public.tienda_maracay USING btree (nombre_apellido);


--
-- Name: idx_maracay_nro_factura; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maracay_nro_factura ON public.tienda_maracay USING btree (nro_factura);


--
-- Name: idx_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nombre ON public.tienda_caracas USING btree (nombre_apellido);


--
-- Name: idx_nro_factura; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nro_factura ON public.tienda_caracas USING btree (nro_factura);


--
-- Name: idx_sesiones_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sesiones_token ON public.sesiones USING btree (token);


--
-- Name: idx_sesiones_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sesiones_usuario ON public.sesiones USING btree (usuario_id);


--
-- Name: idx_tienda_maracaibo_cedula; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tienda_maracaibo_cedula ON public.tienda_maracaibo USING btree (cedula);


--
-- Name: idx_tienda_maracaibo_fecha_factura; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tienda_maracaibo_fecha_factura ON public.tienda_maracaibo USING btree (fecha_factura);


--
-- Name: idx_tienda_maracaibo_nro_factura; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tienda_maracaibo_nro_factura ON public.tienda_maracaibo USING btree (nro_factura);


--
-- Name: usuarios trg_auditoria_usuarios; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_auditoria_usuarios AFTER INSERT OR DELETE OR UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();


--
-- Name: tienda_maracay trigger_update_tienda_maracay; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_tienda_maracay BEFORE UPDATE ON public.tienda_maracay FOR EACH ROW EXECUTE FUNCTION public.update_tienda_maracay_updated_at();


--
-- Name: actividades actividades_completado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_completado_por_fkey FOREIGN KEY (completado_por) REFERENCES public.usuarios(id);


--
-- Name: actividades actividades_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- Name: auditoria_usuarios auditoria_usuarios_usuario_accion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_usuarios
    ADD CONSTRAINT auditoria_usuarios_usuario_accion_id_fkey FOREIGN KEY (usuario_accion_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: auditoria_usuarios auditoria_usuarios_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_usuarios
    ADD CONSTRAINT auditoria_usuarios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: reset_tokens reset_tokens_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reset_tokens
    ADD CONSTRAINT reset_tokens_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: sesiones sesiones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesiones
    ADD CONSTRAINT sesiones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict BiXQA1EmHF56W9ucTyUmf78amb8TM5gUtLcOAXHq1IFPrWBL0y54hwRvUNyLobL


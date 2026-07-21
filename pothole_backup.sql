--
-- PostgreSQL database dump
--

\restrict nodEGdmtXQyP7Fxl0P1WjmkOQc1sNZXKMOoD7dxCNnG8KKlP1S8s80GXdyWRuc2

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

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
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: detection_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detection_images (
    id integer NOT NULL,
    detection_id integer NOT NULL,
    image_path text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: detection_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.detection_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: detection_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.detection_images_id_seq OWNED BY public.detection_images.id;


--
-- Name: detections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detections (
    id integer NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    pothole_count integer NOT NULL,
    confidence_avg double precision,
    image_path text,
    status character varying(50) DEFAULT 'reported'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    location public.geography(Point,4326),
    reports_count integer DEFAULT 1,
    reference_id character varying(20)
);


--
-- Name: detections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.detections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: detections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.detections_id_seq OWNED BY public.detections.id;


--
-- Name: detection_images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detection_images ALTER COLUMN id SET DEFAULT nextval('public.detection_images_id_seq'::regclass);


--
-- Name: detections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detections ALTER COLUMN id SET DEFAULT nextval('public.detections_id_seq'::regclass);


--
-- Data for Name: detection_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.detection_images (id, detection_id, image_path, created_at) FROM stdin;
1	9	uploads/supporting_9_2potholes.png	2026-07-03 08:17:35.398434
2	10	uploads/supporting_10_2potholes.png	2026-07-03 08:19:09.182188
\.


--
-- Data for Name: detections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.detections (id, latitude, longitude, pothole_count, confidence_avg, image_path, status, created_at, location, reports_count, reference_id) FROM stdin;
1	19.076	72.877	1	0.891	uploads/King-circle.png	reported	2026-07-01 09:08:55.528051	0101000020E6100000E3A59BC420385240FA7E6ABC74133340	1	PW-2026-0001
3	19.048099050846766	72.87067330257887	1	0.891	uploads/King-circle.png	reported	2026-07-02 10:29:04.299045	0101000020E6100000E604841CB9375240025B2A38500C3340	1	PW-2026-0003
4	19.053810568664538	72.88988108395162	1	0.891	uploads/King-circle.png	reported	2026-07-02 13:43:14.61675	0101000020E6100000AE39CACFF3385240E6978887C60D3340	1	PW-2026-0004
5	19.055465568389554	72.87972840788568	1	0.618	uploads/pothole-four.png	reported	2026-07-03 05:34:10.266789	0101000020E6100000CB4E61784D3852408549D2FD320E3340	1	PW-2026-0005
6	12.91722	77.589235	1	0.568	uploads/1000262950.jpg	reported	2026-07-03 05:44:31.844568	0101000020E610000026AAB706B665534068791EDC9DD52940	1	PW-2026-0006
8	12.917427052093466	77.58941383106132	1	0.891	uploads/King-circle.png	under_review	2026-07-03 06:07:14.414482	0101000020E6100000FB0DCAF4B86553400C6AA2FFB8D52940	1	PW-2026-0008
7	12.917427052093466	77.58941383106132	1	0.568	uploads/1000262950.jpg	resolved	2026-07-03 06:07:05.647149	0101000020E6100000FB0DCAF4B86553400C6AA2FFB8D52940	1	PW-2026-0007
9	12.917438235161109	77.5894284708875	1	0.891	uploads/King-circle.png	reported	2026-07-03 08:17:35.386257	0101000020E6100000C2723132B9655340DD3BE076BAD52940	1	PW-2026-0009
10	12.917438235161109	77.5894284708875	1	0.891	uploads/King-circle.png	reported	2026-07-03 08:19:09.171673	0101000020E6100000C2723132B9655340DD3BE076BAD52940	1	PW-2026-0010
11	18.974350791050707	72.87341727134643	1	0.891	uploads/King-circle.png	reported	2026-07-03 09:13:20.452827	0101000020E6100000720C8E11E6375240FF64AE0D6FF93240	1	PW-2026-0011
14	19.091028006957604	72.97631610012907	9	0.539	uploads/2potholes.png	reported	2026-07-19 15:59:56.934342	0101000020E6100000352786F67B3E524029E7889C4D173340	1	PW-2026-0014
12	12.866315877474877	77.60614281478475	1	0.618	uploads/pothole-four.png	reported	2026-07-19 14:50:45.189589	0101000020E61000002D8D3B0BCB665340318533C18DBB2940	3	PW-2026-0012
15	12.8673542	77.5942897	1	0.618	uploads/pothole-four.png	reported	2026-07-19 18:25:23.196723	0101000020E61000006176AAD708665340B31886D915BC2940	1	PW-2026-0015
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Name: detection_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.detection_images_id_seq', 2, true);


--
-- Name: detections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.detections_id_seq', 15, true);


--
-- Name: detection_images detection_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detection_images
    ADD CONSTRAINT detection_images_pkey PRIMARY KEY (id);


--
-- Name: detections detections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detections
    ADD CONSTRAINT detections_pkey PRIMARY KEY (id);


--
-- Name: detections detections_reference_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detections
    ADD CONSTRAINT detections_reference_id_key UNIQUE (reference_id);


--
-- Name: detection_images detection_images_detection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detection_images
    ADD CONSTRAINT detection_images_detection_id_fkey FOREIGN KEY (detection_id) REFERENCES public.detections(id);


--
-- PostgreSQL database dump complete
--

\unrestrict nodEGdmtXQyP7Fxl0P1WjmkOQc1sNZXKMOoD7dxCNnG8KKlP1S8s80GXdyWRuc2


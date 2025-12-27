CREATE TYPE "public"."campanha_recorrencia" AS ENUM('nenhuma', 'diario', 'semanal', 'mensal');--> statement-breakpoint
CREATE TYPE "public"."campanha_status" AS ENUM('rascunho', 'agendada', 'em_andamento', 'concluida', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."destinatario_status" AS ENUM('pendente', 'enviada', 'entregue', 'lida', 'respondida', 'falhou');--> statement-breakpoint
CREATE TYPE "public"."hsm_status" AS ENUM('pendente', 'aprovado', 'rejeitado');--> statement-breakpoint
CREATE TYPE "public"."tag_cor" AS ENUM('gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink');--> statement-breakpoint
CREATE TYPE "public"."template_tipo" AS ENUM('interno', 'hsm');--> statement-breakpoint
ALTER TYPE "public"."canal" ADD VALUE 'instagram';--> statement-breakpoint
ALTER TYPE "public"."canal" ADD VALUE 'messenger';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campanha_destinatarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campanha_id" uuid NOT NULL,
	"contato_id" uuid NOT NULL,
	"status" "destinatario_status" DEFAULT 'pendente' NOT NULL,
	"erro" text,
	"enviada_at" timestamp with time zone,
	"entregue_at" timestamp with time zone,
	"lida_at" timestamp with time zone,
	"respondida_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campanha_execucoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campanha_id" uuid NOT NULL,
	"iniciada_at" timestamp with time zone DEFAULT now() NOT NULL,
	"concluida_at" timestamp with time zone,
	"total_enviadas" integer DEFAULT 0 NOT NULL,
	"total_entregues" integer DEFAULT 0 NOT NULL,
	"total_lidas" integer DEFAULT 0 NOT NULL,
	"total_respondidas" integer DEFAULT 0 NOT NULL,
	"total_falhas" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campanhas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(100) NOT NULL,
	"template_id" uuid NOT NULL,
	"filtros" jsonb,
	"status" "campanha_status" DEFAULT 'rascunho' NOT NULL,
	"agendada_para" timestamp with time zone,
	"recorrencia" "campanha_recorrencia" DEFAULT 'nenhuma' NOT NULL,
	"recorrencia_fim" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contato_tags" (
	"contato_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contato_tags_contato_id_tag_id_pk" PRIMARY KEY("contato_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(50) NOT NULL,
	"cor" "tag_cor" DEFAULT 'gray' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "template_categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(50) NOT NULL,
	"is_sistema" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "template_categorias_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"categoria_id" uuid,
	"nome" varchar(100) NOT NULL,
	"conteudo" text NOT NULL,
	"tipo" "template_tipo" DEFAULT 'interno' NOT NULL,
	"hsm_nome" varchar(100),
	"hsm_status" "hsm_status",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campanha_destinatarios" ADD CONSTRAINT "campanha_destinatarios_campanha_id_campanhas_id_fk" FOREIGN KEY ("campanha_id") REFERENCES "public"."campanhas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campanha_destinatarios" ADD CONSTRAINT "campanha_destinatarios_contato_id_contatos_id_fk" FOREIGN KEY ("contato_id") REFERENCES "public"."contatos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campanha_execucoes" ADD CONSTRAINT "campanha_execucoes_campanha_id_campanhas_id_fk" FOREIGN KEY ("campanha_id") REFERENCES "public"."campanhas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campanhas" ADD CONSTRAINT "campanhas_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contato_tags" ADD CONSTRAINT "contato_tags_contato_id_contatos_id_fk" FOREIGN KEY ("contato_id") REFERENCES "public"."contatos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contato_tags" ADD CONSTRAINT "contato_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "templates" ADD CONSTRAINT "templates_categoria_id_template_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."template_categorias"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_campanha_dest_unique" ON "campanha_destinatarios" USING btree ("campanha_id","contato_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_campanha_dest_campanha" ON "campanha_destinatarios" USING btree ("campanha_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_campanha_dest_status" ON "campanha_destinatarios" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_campanha_exec_campanha" ON "campanha_execucoes" USING btree ("campanha_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_campanhas_status" ON "campanhas" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_campanhas_agendada" ON "campanhas" USING btree ("agendada_para");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contato_tags_contato" ON "contato_tags" USING btree ("contato_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contato_tags_tag" ON "contato_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_templates_categoria" ON "templates" USING btree ("categoria_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_templates_tipo" ON "templates" USING btree ("tipo");
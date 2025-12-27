CREATE TYPE "public"."canal" AS ENUM('whatsapp');--> statement-breakpoint
CREATE TYPE "public"."direcao_mensagem" AS ENUM('entrada', 'saida');--> statement-breakpoint
CREATE TYPE "public"."estado_jornada" AS ENUM('inicial', 'boas_vindas', 'coletando_nome', 'coletando_idade', 'coletando_instrumento', 'verificando_saxofone', 'coletando_experiencia', 'coletando_disponibilidade', 'incompativel', 'qualificado', 'atendimento_humano');--> statement-breakpoint
CREATE TYPE "public"."origem" AS ENUM('organico', 'campanha', 'indicacao');--> statement-breakpoint
CREATE TYPE "public"."status_conversa" AS ENUM('ativa', 'encerrada');--> statement-breakpoint
CREATE TYPE "public"."status_envio" AS ENUM('pendente', 'enviada', 'entregue', 'lida', 'falhou');--> statement-breakpoint
CREATE TYPE "public"."tipo_contato" AS ENUM('desconhecido', 'responsavel', 'interessado_direto');--> statement-breakpoint
CREATE TYPE "public"."tipo_mensagem" AS ENUM('texto', 'automatica', 'manual');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "administradores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"senha_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "administradores_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contatos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telefone" varchar(20) NOT NULL,
	"nome" varchar(200),
	"tipo" "tipo_contato" DEFAULT 'desconhecido' NOT NULL,
	"origem" "origem" DEFAULT 'organico' NOT NULL,
	"origem_campanha" varchar(50),
	"canal" "canal" DEFAULT 'whatsapp' NOT NULL,
	"estado_jornada" "estado_jornada" DEFAULT 'inicial' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contatos_telefone_unique" UNIQUE("telefone")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contato_id" uuid NOT NULL,
	"canal" "canal" NOT NULL,
	"status" "status_conversa" DEFAULT 'ativa' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contato_id" uuid,
	"tipo" varchar(50) NOT NULL,
	"dados" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "interessados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contato_id" uuid NOT NULL,
	"nome" varchar(200) NOT NULL,
	"idade" integer NOT NULL,
	"instrumento_desejado" varchar(100) NOT NULL,
	"instrumento_sugerido" varchar(100),
	"experiencia_musical" text,
	"expectativas" text,
	"disponibilidade_horario" boolean NOT NULL,
	"compativel" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mensagens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversa_id" uuid NOT NULL,
	"direcao" "direcao_mensagem" NOT NULL,
	"conteudo" text NOT NULL,
	"tipo" "tipo_mensagem" NOT NULL,
	"enviado_por" uuid,
	"whatsapp_id" varchar(100),
	"status_envio" "status_envio" DEFAULT 'enviada' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversas" ADD CONSTRAINT "conversas_contato_id_contatos_id_fk" FOREIGN KEY ("contato_id") REFERENCES "public"."contatos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "eventos" ADD CONSTRAINT "eventos_contato_id_contatos_id_fk" FOREIGN KEY ("contato_id") REFERENCES "public"."contatos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interessados" ADD CONSTRAINT "interessados_contato_id_contatos_id_fk" FOREIGN KEY ("contato_id") REFERENCES "public"."contatos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_conversa_id_conversas_id_fk" FOREIGN KEY ("conversa_id") REFERENCES "public"."conversas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_enviado_por_administradores_id_fk" FOREIGN KEY ("enviado_por") REFERENCES "public"."administradores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_contato_telefone" ON "contatos" USING btree ("telefone");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contato_estado" ON "contatos" USING btree ("estado_jornada");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contato_origem" ON "contatos" USING btree ("origem");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contato_created" ON "contatos" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_conversa_contato" ON "conversas" USING btree ("contato_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_conversa_status" ON "conversas" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_conversa_updated" ON "conversas" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_evento_contato" ON "eventos" USING btree ("contato_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_evento_tipo" ON "eventos" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_evento_created" ON "eventos" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_interessado_contato" ON "interessados" USING btree ("contato_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_interessado_instrumento" ON "interessados" USING btree ("instrumento_desejado");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mensagem_conversa" ON "mensagens" USING btree ("conversa_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_mensagem_whatsapp" ON "mensagens" USING btree ("whatsapp_id");
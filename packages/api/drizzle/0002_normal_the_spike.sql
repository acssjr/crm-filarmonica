CREATE TYPE "public"."alerta_tipo" AS ENUM('info', 'warning', 'success');--> statement-breakpoint
CREATE TYPE "public"."automacao_execucao_status" AS ENUM('executando', 'sucesso', 'falha', 'aguardando');--> statement-breakpoint
CREATE TYPE "public"."automacao_trigger_tipo" AS ENUM('novo_contato', 'tag_adicionada', 'tag_removida', 'jornada_mudou', 'tempo_sem_interacao', 'mensagem_recebida');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alertas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" "alerta_tipo" DEFAULT 'info' NOT NULL,
	"titulo" varchar(100) NOT NULL,
	"mensagem" text NOT NULL,
	"contato_id" uuid,
	"automacao_id" uuid NOT NULL,
	"lido" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "automacao_execucoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automacao_id" uuid NOT NULL,
	"contato_id" uuid NOT NULL,
	"status" "automacao_execucao_status" DEFAULT 'executando' NOT NULL,
	"acoes_executadas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"erro" text,
	"proxima_acao_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "automacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(100) NOT NULL,
	"ativo" boolean DEFAULT false NOT NULL,
	"trigger_tipo" "automacao_trigger_tipo" NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"condicoes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"acoes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alertas" ADD CONSTRAINT "alertas_contato_id_contatos_id_fk" FOREIGN KEY ("contato_id") REFERENCES "public"."contatos"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alertas" ADD CONSTRAINT "alertas_automacao_id_automacoes_id_fk" FOREIGN KEY ("automacao_id") REFERENCES "public"."automacoes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "automacao_execucoes" ADD CONSTRAINT "automacao_execucoes_automacao_id_automacoes_id_fk" FOREIGN KEY ("automacao_id") REFERENCES "public"."automacoes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "automacao_execucoes" ADD CONSTRAINT "automacao_execucoes_contato_id_contatos_id_fk" FOREIGN KEY ("contato_id") REFERENCES "public"."contatos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_alertas_lido" ON "alertas" USING btree ("lido");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_alertas_automacao" ON "alertas" USING btree ("automacao_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_alertas_created" ON "alertas" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_automacao_exec_automacao" ON "automacao_execucoes" USING btree ("automacao_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_automacao_exec_contato" ON "automacao_execucoes" USING btree ("contato_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_automacao_exec_status" ON "automacao_execucoes" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_automacao_exec_proxima" ON "automacao_execucoes" USING btree ("proxima_acao_em");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_automacoes_ativo" ON "automacoes" USING btree ("ativo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_automacoes_trigger" ON "automacoes" USING btree ("trigger_tipo");
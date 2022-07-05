package logger

import (
  log "github.com/sirupsen/logrus"
)

// Event stores messages to log later, from our standard interface
type Event struct {
	code	int
	context	string
	message string
}

// StandardLogger enforces specific log message formats
type StandardLogger struct {
	*log.Logger
}

// NewLogger initializes the standard logger
func Init() *StandardLogger {
	var baseLogger = log.New()

	var standardLogger = &StandardLogger{baseLogger}

	standardLogger.Formatter = &log.JSONFormatter{}

	return standardLogger
}

// Build error message with fields
func (l *StandardLogger) ThrowError(code int, context string, msg string) {
	l.WithFields(log.Fields{"code": code, "context": context}).Info(msg)
}
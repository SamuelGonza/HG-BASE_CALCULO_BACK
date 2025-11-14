import swaggerJsdoc from 'swagger-jsdoc';
import { GLOBAL_ENV } from '@/shared/constants';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Base de Cálculo API',
      version: '1.0.0',
      description: 'API para el sistema de gestión de preparación de medicamentos estériles y oncológicos',
      contact: {
        name: 'Soporte API',
        email: 'soporte@hospital.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${GLOBAL_ENV.PORT || 3000}${GLOBAL_ENV.ROUTER_SUBFIJE || '/api'}`,
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido del endpoint de login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            ok: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Mensaje de error'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            ok: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operación exitosa'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'ObjectId',
              example: '507f1f77bcf86cd799439011'
            },
            username: {
              type: 'string',
              example: 'RBOCNETT'
            },
            nombre: {
              type: 'string',
              example: 'ROSA LEONOR BONETT VILA'
            },
            tipoUsuario: {
              type: 'string',
              enum: ['QUÍMICO FARMACÉUTICO', 'ADMINISTRADOR', 'INVITADO', 'TÉCNICO'],
              example: 'QUÍMICO FARMACÉUTICO'
            },
            cargo: {
              type: 'string',
              example: 'DIRECTORA TÉCNICA'
            },
            identificacion: {
              type: 'string',
              example: '43.977.097'
            },
            tarjetaProfesional: {
              type: 'string',
              example: '43.977.097'
            },
            firmaUrl: {
              type: 'string',
              example: 'https://res.cloudinary.com/cloud_name/image/upload/v1234567890/firmas/RBOCNETT_43_977_097.png'
            },
            firmaPublicId: {
              type: 'string',
              example: 'firmas/RBOCNETT_43_977_097'
            },
            rolSistema: {
              type: 'string',
              enum: ['AUXILIAR', 'QUIMICO', 'COORDINADOR', 'AUDITOR'],
              example: 'COORDINADOR'
            },
            activo: {
              type: 'boolean',
              example: true
            },
            esInterpretacion: {
              type: 'boolean',
              example: true
            },
            esProduccion: {
              type: 'boolean',
              example: false
            },
            esCalidad: {
              type: 'boolean',
              example: false
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'nombre', 'tipoUsuario', 'cargo', 'identificacion', 'password', 'rolSistema'],
          properties: {
            username: {
              type: 'string',
              example: 'RBOCNETT'
            },
            nombre: {
              type: 'string',
              example: 'ROSA LEONOR BONETT VILA'
            },
            tipoUsuario: {
              type: 'string',
              enum: ['QUÍMICO FARMACÉUTICO', 'ADMINISTRADOR', 'INVITADO', 'TÉCNICO'],
              example: 'QUÍMICO FARMACÉUTICO'
            },
            cargo: {
              type: 'string',
              example: 'DIRECTORA TÉCNICA'
            },
            identificacion: {
              type: 'string',
              example: '43.977.097'
            },
            tarjetaProfesional: {
              type: 'string',
              example: '43.977.097'
            },
            firma: {
              type: 'string',
              format: 'base64',
              description: 'Firma en formato base64 (se subirá a Cloudinary automáticamente). Formato: data:image/png;base64,...',
              example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'password123'
            },
            rolSistema: {
              type: 'string',
              enum: ['AUXILIAR', 'QUIMICO', 'COORDINADOR', 'AUDITOR'],
              example: 'COORDINADOR'
            },
            esInterpretacion: {
              type: 'boolean',
              example: true
            },
            esProduccion: {
              type: 'boolean',
              example: false
            },
            esCalidad: {
              type: 'boolean',
              example: false
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              example: 'RBOCNETT'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'password123'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            ok: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Login exitoso'
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                user: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          }
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: {
              type: 'string',
              format: 'password',
              example: 'password123'
            },
            newPassword: {
              type: 'string',
              format: 'password',
              example: 'newPassword456'
            }
          }
        },
        Paciente: {
          type: 'object',
          required: ['nombre', 'documento', 'aseguradora', 'diagnostico'],
          properties: {
            nombre: {
              type: 'string',
              example: 'Pedro García'
            },
            documento: {
              type: 'string',
              example: '12345678'
            },
            aseguradora: {
              type: 'string',
              example: 'EPS Sura'
            },
            diagnostico: {
              type: 'string',
              example: 'Cáncer de pulmón - Estadio III'
            }
          }
        },
        CreateMezclaRequest: {
          type: 'object',
          required: ['paciente', 'medicamentoId', 'vehiculoId', 'envaseId', 'dosisPrescrita', 'unidadDosis'],
          properties: {
            paciente: {
              $ref: '#/components/schemas/Paciente'
            },
            medicamentoId: {
              type: 'string',
              format: 'ObjectId',
              example: '507f1f77bcf86cd799439011'
            },
            vehiculoId: {
              type: 'string',
              format: 'ObjectId',
              example: '507f1f77bcf86cd799439013'
            },
            envaseId: {
              type: 'string',
              format: 'ObjectId',
              example: '507f1f77bcf86cd799439014'
            },
            dosisPrescrita: {
              type: 'number',
              minimum: 0,
              example: 50
            },
            unidadDosis: {
              type: 'string',
              example: 'mg'
            },
            cantidadMezclas: {
              type: 'number',
              minimum: 1,
              default: 1,
              example: 1
            }
          }
        },
        CreateProductionRequest: {
          type: 'object',
          required: ['lineaProduccion', 'mezclas'],
          properties: {
            lineaProduccion: {
              type: 'string',
              enum: ['ONCO', 'ESTERIL'],
              example: 'ESTERIL'
            },
            fechaProduccion: {
              type: 'string',
              format: 'date-time',
              example: '2024-12-15T07:00:00.000Z'
            },
            qfInterpretacion: {
              type: 'string',
              example: 'ROSA LEONOR BONETT VILA'
            },
            qfProduccion: {
              type: 'string',
              example: 'SANTIAGO ARBELÁEZ GUZMAN'
            },
            qfCalidad: {
              type: 'string',
              example: 'DAVID RESTREPO CRESPO'
            },
            mezclas: {
              type: 'array',
              minItems: 1,
              items: {
                $ref: '#/components/schemas/CreateMezclaRequest'
              }
            }
          }
        },
        Mezcla: {
          type: 'object',
          properties: {
            paciente: {
              $ref: '#/components/schemas/Paciente'
            },
            medicamento: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'ObjectId'
                },
                nombre: {
                  type: 'string',
                  example: 'Ondansetron'
                },
                concentracion: {
                  type: 'string',
                  example: '2mg/ml'
                },
                viaAdministracion: {
                  type: 'string',
                  example: 'IV'
                },
                dosisPrescrita: {
                  type: 'number',
                  example: 16
                },
                unidadDosis: {
                  type: 'string',
                  example: 'mg'
                }
              }
            },
            envase: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'ObjectId'
                },
                tipo: {
                  type: 'string',
                  example: 'Bolsa'
                },
                nombre: {
                  type: 'string',
                  example: 'Bolsa de infusión 100ml'
                }
              }
            },
            vehiculo: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'ObjectId'
                },
                nombre: {
                  type: 'string',
                  example: 'SSN 0.9%'
                },
                volumenVehiculo: {
                  type: 'number',
                  example: 92
                }
              }
            },
            calculos: {
              type: 'object',
              properties: {
                volumenExtraer: {
                  type: 'number',
                  example: 8
                },
                volumenMezcla: {
                  type: 'number',
                  example: 8
                },
                volumenVehiculo: {
                  type: 'number',
                  example: 92
                },
                volumenTotal: {
                  type: 'number',
                  example: 100
                },
                unidadesInsumo: {
                  type: 'number',
                  example: 1
                }
              }
            },
            loteMezcla: {
              type: 'string',
              example: 'HG0117-160724-ET-01954'
            },
            fechaVencimiento: {
              type: 'string',
              format: 'date-time',
              example: '2024-12-16T07:00:00.000Z'
            },
            cantidadMezclas: {
              type: 'number',
              example: 1
            }
          }
        },
        Production: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId',
              example: '507f1f77bcf86cd799439011'
            },
            codigo: {
              type: 'string',
              example: 'PROD-20241215-0001'
            },
            fechaProduccion: {
              type: 'string',
              format: 'date-time',
              example: '2024-12-15T07:00:00.000Z'
            },
            qfInterpretacion: {
              type: 'string',
              example: 'ROSA LEONOR BONETT VILA'
            },
            qfProduccion: {
              type: 'string',
              example: 'SANTIAGO ARBELÁEZ GUZMAN'
            },
            qfCalidad: {
              type: 'string',
              example: 'DAVID RESTREPO CRESPO'
            },
            lineaProduccion: {
              type: 'string',
              enum: ['ONCO', 'ESTERIL'],
              example: 'ESTERIL'
            },
            cantidadMezclas: {
              type: 'number',
              example: 5
            },
            mezclas: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Mezcla'
              }
            },
            estado: {
              type: 'string',
              enum: ['CREADO', 'VALIDADO', 'CALCULADO', 'PROGRAMADO', 'PRODUCIDO', 'QC', 'ETIQUETADO', 'FINALIZADO'],
              example: 'CREADO'
            },
            versionMotorCalculo: {
              type: 'string',
              example: '1.0.0'
            }
          }
        },
        TransitionRequest: {
          type: 'object',
          required: ['estado'],
          properties: {
            estado: {
              type: 'string',
              enum: ['VALIDADO', 'CALCULADO', 'PROGRAMADO', 'PRODUCIDO', 'QC', 'ETIQUETADO', 'FINALIZADO'],
              example: 'VALIDADO'
            }
          }
        },
        Medicine: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId'
            },
            nombre: {
              type: 'string',
              example: 'Cisplatino'
            },
            principioActivo: {
              type: 'string',
              example: 'Cisplatino'
            },
            concentracion: {
              type: 'string',
              example: '1mg/ml'
            },
            presentaciones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  volumen: {
                    type: 'number',
                    example: 50
                  },
                  unidad: {
                    type: 'string',
                    example: 'ml'
                  },
                  cantidad: {
                    type: 'number',
                    example: 1
                  },
                  tipoEnvase: {
                    type: 'string',
                    example: 'Frasco Ámpula 50ml'
                  }
                }
              }
            },
            viaAdministracion: {
              type: 'string',
              example: 'Intravenosa'
            },
            lineaProductiva: {
              type: 'string',
              enum: ['ONCO', 'ESTERIL'],
              example: 'ONCO'
            },
            habilitado: {
              type: 'boolean',
              example: true
            }
          }
        },
        CreateMedicineRequest: {
          type: 'object',
          required: ['nombre', 'principioActivo', 'concentracion', 'presentaciones', 'viaAdministracion', 'lineaProductiva'],
          properties: {
            nombre: {
              type: 'string',
              example: 'Cisplatino'
            },
            principioActivo: {
              type: 'string',
              example: 'Cisplatino'
            },
            concentracion: {
              type: 'string',
              example: '1mg/ml'
            },
            presentaciones: {
              type: 'array',
              items: {
                type: 'object',
                required: ['volumen', 'unidad', 'cantidad', 'tipoEnvase'],
                properties: {
                  volumen: {
                    type: 'number',
                    example: 50
                  },
                  unidad: {
                    type: 'string',
                    example: 'ml'
                  },
                  cantidad: {
                    type: 'number',
                    example: 1
                  },
                  tipoEnvase: {
                    type: 'string',
                    example: 'Frasco Ámpula 50ml'
                  }
                }
              }
            },
            viaAdministracion: {
              type: 'string',
              example: 'Intravenosa'
            },
            lineaProductiva: {
              type: 'string',
              enum: ['ONCO', 'ESTERIL'],
              example: 'ONCO'
            },
            habilitado: {
              type: 'boolean',
              example: true
            }
          }
        },
        Lab: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId'
            },
            nombre: {
              type: 'string',
              example: 'Pfizer'
            },
            pais: {
              type: 'string',
              example: 'Estados Unidos'
            },
            habilitado: {
              type: 'boolean',
              example: true
            }
          }
        },
        CreateLabRequest: {
          type: 'object',
          required: ['nombre', 'pais'],
          properties: {
            nombre: {
              type: 'string',
              example: 'Pfizer'
            },
            pais: {
              type: 'string',
              example: 'Estados Unidos'
            },
            habilitado: {
              type: 'boolean',
              example: true
            }
          }
        },
        Vehicle: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId'
            },
            nombre: {
              type: 'string',
              example: 'Solución Salina 0.9%'
            },
            compatibleConLinea: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['ONCO', 'ESTERIL']
              },
              example: ['ONCO', 'ESTERIL']
            }
          }
        },
        CreateVehicleRequest: {
          type: 'object',
          required: ['nombre', 'compatibleConLinea'],
          properties: {
            nombre: {
              type: 'string',
              example: 'Solución Salina 0.9%'
            },
            compatibleConLinea: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['ONCO', 'ESTERIL']
              },
              example: ['ONCO', 'ESTERIL']
            }
          }
        },
        Container: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId'
            },
            tipo: {
              type: 'string',
              example: 'Jeringa 10ml'
            },
            volumenMax: {
              type: 'number',
              example: 10
            },
            material: {
              type: 'string',
              example: 'Plástico'
            }
          }
        },
        CreateContainerRequest: {
          type: 'object',
          required: ['tipo', 'volumenMax', 'material'],
          properties: {
            tipo: {
              type: 'string',
              example: 'Jeringa 10ml'
            },
            volumenMax: {
              type: 'number',
              minimum: 0,
              example: 10
            },
            material: {
              type: 'string',
              example: 'Plástico'
            }
          }
        },
        Stability: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId'
            },
            medicamentoId: {
              type: 'string',
              format: 'ObjectId'
            },
            laboratorioId: {
              type: 'string',
              format: 'ObjectId'
            },
            vehiculoId: {
              type: 'string',
              format: 'ObjectId'
            },
            envaseId: {
              type: 'string',
              format: 'ObjectId'
            },
            horasEstabilidad: {
              type: 'number',
              minimum: 0,
              example: 24
            },
            condiciones: {
              type: 'string',
              example: 'Refrigerado 2-8°C, protegido de la luz'
            }
          }
        },
        CreateStabilityRequest: {
          type: 'object',
          required: ['medicamentoId', 'laboratorioId', 'vehiculoId', 'envaseId', 'horasEstabilidad', 'condiciones'],
          properties: {
            medicamentoId: {
              type: 'string',
              format: 'ObjectId',
              example: '507f1f77bcf86cd799439011'
            },
            laboratorioId: {
              type: 'string',
              format: 'ObjectId',
              example: '507f1f77bcf86cd799439012'
            },
            vehiculoId: {
              type: 'string',
              format: 'ObjectId',
              example: '507f1f77bcf86cd799439013'
            },
            envaseId: {
              type: 'string',
              format: 'ObjectId',
              example: '507f1f77bcf86cd799439014'
            },
            horasEstabilidad: {
              type: 'number',
              minimum: 0,
              example: 24
            },
            condiciones: {
              type: 'string',
              example: 'Refrigerado 2-8°C, protegido de la luz'
            }
          }
        },
        Document: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId'
            },
            productionId: {
              type: 'string',
              format: 'ObjectId'
            },
            tipo: {
              type: 'string',
              enum: ['SOLICITUD', 'ORDEN', 'INSUMOS', 'QC', 'ETIQUETAS', 'ACTA'],
              example: 'SOLICITUD'
            },
            fileUrl: {
              type: 'string',
              example: '/documents/solicitud-507f1f77bcf86cd799439011.pdf'
            },
            versionPlantilla: {
              type: 'string',
              example: '1.0.0'
            },
            generadoPor: {
              type: 'string',
              format: 'ObjectId'
            },
            generadoEn: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        AuditLog: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'ObjectId'
            },
            entidad: {
              type: 'string',
              example: 'Production'
            },
            entidadId: {
              type: 'string',
              format: 'ObjectId'
            },
            accion: {
              type: 'string',
              example: 'CREATE'
            },
            cambios: {
              type: 'object',
              additionalProperties: true
            },
            usuarioId: {
              type: 'string',
              format: 'ObjectId'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints de autenticación y gestión de usuarios'
      },
      {
        name: 'Productions',
        description: 'Endpoints para gestión de producciones'
      },
      {
        name: 'Documents',
        description: 'Endpoints para generación y gestión de documentos'
      },
      {
        name: 'Catalog',
        description: 'Endpoints para gestión de catálogos (medicamentos, laboratorios, etc.)'
      },
      {
        name: 'Audit',
        description: 'Endpoints para consulta de auditoría'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/routes/**/*.ts'
  ]
};

export const swaggerSpec = swaggerJsdoc(options);


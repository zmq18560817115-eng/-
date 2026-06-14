## 五、 核心数据模型与 15 组高保真测试数据集 

以下数据结构和真实临床 Mock 数据包，直接作为 **AI 相似度推荐算法（欧氏距离）** 的计算输入源与测试案例库。覆盖了自购自主模式、医嘱导入模式、以及年轻化退行性病变三种典型特征分布。

### 5.1 医生临床经验案例库 (Doctor_Knowledge_Base) —— 完整 15 组真实医疗级数据
```json
[
  { "case_id": 1, "doctor_id": 1001, "input_age": 65, "input_wear": 4, "input_fluid": 3, "input_pain": 8, "output_left_force": 25, "output_right_force": 22, "output_duration": 25, "output_temp": 45, "output_vibration": 2 },
  { "case_id": 2, "doctor_id": 1001, "input_age": 55, "input_wear": 2, "input_fluid": 1, "input_pain": 4, "output_left_force": 15, "output_right_force": 15, "output_duration": 20, "output_temp": 42, "vibration": 1 },
  { "case_id": 3, "doctor_id": 1002, "input_age": 72, "input_wear": 5, "input_fluid": 4, "input_pain": 9, "output_left_force": 30, "output_right_force": 28, "output_duration": 30, "output_temp": 48, "vibration": 0 },
  { "case_id": 4, "doctor_id": 1002, "input_age": 32, "input_wear": 1, "input_fluid": 2, "input_pain": 5, "output_left_force": 12, "output_right_force": 12, "output_duration": 15, "output_temp": 40, "vibration": 1 },
  { "case_id": 5, "doctor_id": 1001, "input_age": 60, "input_wear": 3, "input_fluid": 2, "input_pain": 6, "output_left_force": 18, "output_right_force": 18, "output_duration": 20, "output_temp": 43, "vibration": 2 },
  { "case_id": 6, "doctor_id": 1001, "input_age": 68, "input_wear": 4, "input_fluid": 2, "input_pain": 7, "output_left_force": 22, "output_right_force": 20, "output_duration": 25, "output_temp": 44, "vibration": 1 },
  { "case_id": 7, "doctor_id": 1002, "input_age": 50, "input_wear": 2, "input_fluid": 2, "input_pain": 5, "output_left_force": 16, "output_right_force": 16, "output_duration": 20, "output_temp": 41, "vibration": 2 },
  { "case_id": 8, "doctor_id": 1001, "input_age": 75, "input_wear": 5, "input_fluid": 5, "input_pain": 10, "output_left_force": 32, "output_right_force": 30, "output_duration": 30, "output_temp": 46, "vibration": 0 },
  { "case_id": 9, "doctor_id": 1002, "input_age": 28, "input_wear": 1, "input_fluid": 1, "input_pain": 3, "output_left_force": 10, "output_right_force": 10, "output_duration": 12, "output_temp": 39, "vibration": 1 },
  { "case_id": 10, "doctor_id": 1001, "input_age": 63, "input_wear": 3, "input_fluid": 3, "input_pain": 7, "output_left_force": 20, "output_right_force": 18, "output_duration": 22, "output_temp": 43, "vibration": 2 },
  { "case_id": 11, "doctor_id": 1001, "input_age": 57, "input_wear": 3, "input_fluid": 1, "input_pain": 5, "output_left_force": 16, "output_right_force": 15, "output_duration": 20, "output_temp": 42, "vibration": 1 },
  { "case_id": 12, "doctor_id": 1002, "input_age": 70, "input_wear": 4, "input_fluid": 4, "input_pain": 8, "output_left_force": 26, "output_right_force": 25, "output_duration": 25, "output_temp": 45, "vibration": 0 },
  { "case_id": 13, "doctor_id": 1002, "input_age": 35, "input_wear": 2, "input_fluid": 2, "input_pain": 6, "output_left_force": 14, "output_right_force": 14, "output_duration": 15, "output_temp": 41, "vibration": 1 },
  { "case_id": 14, "doctor_id": 1001, "input_age": 66, "input_wear": 4, "input_fluid": 3, "input_pain": 9, "output_left_force": 28, "output_right_force": 26, "output_duration": 25, "output_temp": 46, "vibration": 2 },
  { "case_id": 15, "doctor_id": 1001, "input_age": 52, "input_wear": 1, "input_fluid": 1, "input_pain": 4, "output_left_force": 12, "output_right_force": 12, "output_duration": 15, "output_temp": 40, "vibration": 1 }
]
```

### 5.2 用户管理与系统状态主表
#### 用户主表 (User_Table)
```json
[
  { "user_id": 1001, "phone": "13800138001", "password": "pass_doc_1", "role_type": "Doctor", "nickname": "李正清主任", "created_at": "2026-05-01 09:00:00" },
  { "user_id": 2001, "phone": "18612345678", "password": "pass_pat_1", "role_type": "Patient", "nickname": "王大爷(自购型)", "created_at": "2026-06-01 08:30:00" },
  { "user_id": 2002, "phone": "15599998888", "password": "pass_pat_2", "role_type": "Patient", "nickname": "张阿姨(医嘱型)", "created_at": "2026-06-02 10:15:00" },
  { "user_id": 2003, "phone": "17744445555", "password": "pass_pat_3", "role_type": "Patient", "nickname": "程序员小李(年轻退行性)", "created_at": "2026-06-05 19:00:00" },
  { "user_id": 3001, "phone": "13099990000", "password": "pass_fam_1", "role_type": "Family", "nickname": "家人守护者(小王)", "created_at": "2026-06-01 09:00:00" }
]
```

#### 患者健康状态快照 (Patient_Profile_Table)
```json
[
  { "patient_id": 2001, "age": 67, "cartilage_wear": 4, "joint_fluid": 3, "pain_score": 7, "auth_code": null, "binding_doctor_id": null },
  { "patient_id": 2002, "age": 58, "cartilage_wear": 2, "joint_fluid": 1, "pain_score": 4, "auth_code": "883912", "binding_doctor_id": 1001 },
  { "patient_id": 2003, "age": 32, "cartilage_wear": 1, "joint_fluid": 2, "pain_score": 5, "auth_code": null, "binding_doctor_id": null }
]
```

#### 亲情绑定关联表 (Family_Binding_Table)
```json
[
  { "binding_id": 501, "family_user_id": 3001, "patient_user_id": 2001, "remind_status": false, "emergency_contact": true }
]
```

#### 每日康复训练监测日志表 (Therapy_Log_Table)
```json
[
  { "log_id": 9001, "patient_id": 2001, "therapy_date": "2026-06-09", "mode_used": "Manual", "is_completed": true, "hardware_status": "Normal" },
  { "log_id": 9002, "patient_id": 2002, "therapy_date": "2026-06-09", "mode_used": "AI", "is_completed": false, "hardware_status": "Normal" },
  { "log_id": 9003, "patient_id": 2003, "therapy_date": "2026-06-09", "mode_used": "Cloud", "is_completed": true, "hardware_status": "Normal" }
]
```
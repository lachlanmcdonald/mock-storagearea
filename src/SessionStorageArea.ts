/*
 * Copyright (c) 2023 Lachlan McDonald. All rights reserved.
 * This file is licensed under the MIT License
 * https://github.com/lachlanmcdonald/mock-storagearea
 */
import LocalStorageArea from './LocalStorageArea';

export default class SessionStorageArea extends LocalStorageArea {
	__areaName = 'session';
}
